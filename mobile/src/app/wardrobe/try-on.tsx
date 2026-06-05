import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  Animated, ScrollView, TextInput, Alert, Platform,
  KeyboardAvoidingView, Modal, NativeModules,
} from "react-native";
import Constants from "expo-constants";

// react-native-webview is not bundled in Expo Go — use a safe conditional import
// so the rest of the app keeps working when tested in Expo Go.
const isExpoGo = Constants.appOwnership === "expo";
let WebView: any = null;
if (!isExpoGo) {
  try { WebView = require("react-native-webview").WebView; } catch {}
}
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";
import { useWardrobeStore } from "@store/wardrobeStore";
import { useAuthStore } from "@store/authStore";
import { recommendSizeLocally, SizeResult } from "@utils/sizeRecommender";
import { wardrobeService } from "@services/wardrobeService";

const { width: W, height: H } = Dimensions.get("window");

/* ── Fit colour map ── */
const FIT_COLORS: Record<string, string> = {
  perfect: Colors.success,
  snug:     Colors.primary,
  loose:    Colors.info,
  too_small: Colors.error,
  too_large: Colors.warning,
};

/* ─────────────────────────────────────────────
   Build the MediaPipe HTML page
   Kept in a separate function so it's easy to
   change garment via injectJavaScript without
   reloading the whole WebView.
───────────────────────────────────────────── */
function buildTryOnHtml(initialImageUrl: string, initialType: string): string {
  // Escape single quotes to prevent JS string injection
  const safeUrl = initialImageUrl.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const safeType = initialType.toLowerCase().replace(/[^a-z]/g, "");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no">
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js" crossorigin="anonymous"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:#000;overflow:hidden;width:100vw;height:100vh}
canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
video{display:none}
#loader{
  position:absolute;inset:0;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:16px;z-index:5;
  background:rgba(8,8,8,0.92)
}
.dot-row{display:flex;gap:8px}
.dot{width:8px;height:8px;border-radius:50%;background:#C8FF00;
  animation:pulse 1.2s ease-in-out infinite}
.dot:nth-child(2){animation-delay:.2s}
.dot:nth-child(3){animation-delay:.4s}
@keyframes pulse{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}
#loader-text{color:rgba(255,255,255,0.7);font:500 13px/1.4 system-ui;text-align:center;max-width:220px}
#status-badge{
  position:absolute;top:14px;left:50%;transform:translateX(-50%);
  background:rgba(8,8,8,0.82);color:#C8FF00;padding:7px 16px;
  border-radius:999px;font:600 12px/1 system-ui;z-index:8;
  border:1px solid rgba(200,255,0,0.28);white-space:nowrap;display:none
}
#tip{
  position:absolute;bottom:22px;left:50%;transform:translateX(-50%);
  background:rgba(8,8,8,0.68);color:rgba(255,255,255,0.55);padding:6px 14px;
  border-radius:999px;font:400 11px/1 system-ui;z-index:8;white-space:nowrap;
  pointer-events:none;display:none
}
</style>
</head>
<body>
<video id="v" playsinline autoplay muted></video>
<canvas id="c"></canvas>
<div id="loader">
  <div class="dot-row"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
  <div id="loader-text">Starting Virtual Mirror…<br>Please allow camera access</div>
</div>
<div id="status-badge">● Body tracking active</div>
<div id="tip">Stand back so your full torso is visible</div>
<script>
(function(){
var v=document.getElementById('v'),c=document.getElementById('c'),
    ctx=c.getContext('2d'),
    loader=document.getElementById('loader'),
    loaderText=document.getElementById('loader-text'),
    badge=document.getElementById('status-badge'),
    tip=document.getElementById('tip');

var gImg=null,poseReady=false;
var gType='${safeType}';

function postRN(d){try{window.ReactNativeWebView.postMessage(JSON.stringify(d));}catch(e){}}

// Let React Native update the garment
window.setGarment=function(url,type){
  gType=(type||'top').toLowerCase().replace(/[^a-z]/g,'');
  var img=new Image();
  img.crossOrigin='anonymous';
  img.onload=function(){gImg=img;};
  img.onerror=function(){var i2=new Image();i2.onload=function(){gImg=i2;};i2.src=url;};
  img.src=url;
};

// Resize canvas to fill screen
function resize(){c.width=window.innerWidth;c.height=window.innerHeight;}
resize();window.addEventListener('resize',resize);

// Load initial garment
window.setGarment('${safeUrl}','${safeType}');

function drawGarment(lm){
  if(!gImg||!lm)return;
  var cw=c.width,ch=c.height;
  var ls=lm[11],rs=lm[12],lh=lm[23],rh=lm[24],la=lm[27],ra=lm[28];
  if(!ls||!rs)return;

  // Mirror X so it matches the flipped camera feed
  var mx=function(x){return(1-x)*cw;};
  var my=function(y){return y*ch;};

  var lsx=mx(ls.x),rsx=mx(rs.x),lsy=my(ls.y),rsy=my(rs.y);
  var lhx=lh?mx(lh.x):lsx,rhx=rh?mx(rh.x):rsx;
  var lhy=lh?my(lh.y):lsy+ch*0.3,rhy=rh?my(rh.y):rsy+ch*0.3;

  var smx=(lsx+rsx)/2,smy=(lsy+rsy)/2;
  var hmx=(lhx+rhx)/2,hmy=(lhy+rhy)/2;
  var sw=Math.abs(lsx-rsx),th=hmy-smy;

  if(sw<20)return; // too close / no detection

  var gx,gy,gw,gh;
  var ang=Math.atan2(rsy-lsy,rsx-lsx);

  var isBot=gType.indexOf('bottom')>=0||gType.indexOf('pant')>=0||
            gType.indexOf('jean')>=0||gType.indexOf('skirt')>=0||
            gType.indexOf('short')>=0||gType.indexOf('trouser')>=0;
  var isFull=gType.indexOf('dress')>=0||gType.indexOf('jump')>=0||gType.indexOf('full')>=0;

  if(isBot){
    var hw=Math.max(Math.abs(lhx-rhx),sw*0.8);
    gw=hw*1.6;gh=gw*(gImg.height/gImg.width);
    gx=hmx-gw/2;gy=hmy-gh*0.05;
  }else if(isFull){
    gw=sw*1.75;
    var ay=la?Math.max(my(la.y),my(ra.y)):hmy+ch*0.4;
    gh=(ay-smy)*1.12;
    gx=smx-gw/2;gy=smy-sw*0.08;
  }else{
    // top / shirt
    gw=sw*1.75;
    gh=Math.max(th*1.35,gw*(gImg.height/gImg.width));
    gx=smx-gw/2;gy=smy-sw*0.12;
  }

  ctx.save();
  ctx.translate(gx+gw/2,gy+gh/2);
  ctx.rotate(ang);
  ctx.globalAlpha=0.9;
  ctx.drawImage(gImg,-gw/2,-gh/2,gw,gh);
  ctx.globalAlpha=1;
  ctx.restore();
}

// Init MediaPipe Pose
var pose=new Pose({
  locateFile:function(f){return'https://cdn.jsdelivr.net/npm/@mediapipe/pose/'+f;}
});
pose.setOptions({
  modelComplexity:1,
  smoothLandmarks:true,
  enableSegmentation:false,
  minDetectionConfidence:0.5,
  minTrackingConfidence:0.5
});
pose.onResults(function(r){
  if(!poseReady){
    poseReady=true;
    loader.style.display='none';
    badge.style.display='block';
    tip.style.display='block';
    postRN({type:'POSE_READY'});
    // Hide tip after 4s
    setTimeout(function(){tip.style.display='none';},4000);
  }
  ctx.save();
  ctx.clearRect(0,0,c.width,c.height);
  // Mirror the video feed horizontally (selfie mode)
  ctx.translate(c.width,0);
  ctx.scale(-1,1);
  ctx.drawImage(r.image,0,0,c.width,c.height);
  ctx.restore();
  if(r.poseLandmarks)drawGarment(r.poseLandmarks);
});

// Start camera
loaderText.textContent='Requesting camera…';
navigator.mediaDevices.getUserMedia({
  video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},
  audio:false
}).then(function(stream){
  v.srcObject=stream;
  v.play();
  loaderText.textContent='Loading AI body tracker…';
  postRN({type:'CAMERA_READY'});
  var cam=new Camera(v,{
    onFrame:async function(){await pose.send({image:v});},
    width:640,height:480
  });
  cam.start();
}).catch(function(e){
  loaderText.textContent='Camera access required.\nPlease allow camera permission.';
  postRN({type:'ERROR',message:e.message});
});
})();
</script>
</body>
</html>`;
}

/* ─────────────────────────────────────────────
   Main Try-On Screen
───────────────────────────────────────────── */
export default function TryOnScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    productId: string; imageUrl: string; title: string;
    clothingType: string; sizes: string;
  }>();

  const { items } = useWardrobeStore();
  const { user } = useAuthStore();

  // Camera / pose states
  const [cameraReady, setCameraReady] = useState(false);
  const [poseReady, setPoseReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Active outfit (can be switched via switcher)
  const initialSizes = useMemo<string[]>(() => {
    if (!params.sizes) return [];
    try { return JSON.parse(params.sizes) as string[]; }
    catch { return []; }
  }, [params.sizes]);

  const [activeProduct, setActiveProduct] = useState({
    imageUrl: params.imageUrl,
    title: params.title,
    clothingType: params.clothingType || "top",
    sizes: initialSizes,
  });

  // Size recommender
  const [showSizePanel, setShowSizePanel] = useState(false);
  const [height, setHeight] = useState(user?.height ? String(user.height) : "");
  const [weight, setWeight] = useState(user?.weight ? String(user.weight) : "");
  const [gender, setGender] = useState<"male" | "female" | "unisex">(
    (user?.gender as "male" | "female" | "unisex") ?? "unisex"
  );
  const [sizeResult, setSizeResult] = useState<SizeResult | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Bottom panel expand/collapse
  const panelHeight = useRef(new Animated.Value(0)).current;
  const [panelExpanded, setPanelExpanded] = useState(true);
  const PANEL_COLLAPSED = 70;
  const PANEL_FULL = useMemo(() => (items.length > 1 ? 230 : 160), [items.length]);

  const webViewRef = useRef<WebView>(null);
  const htmlContent = useRef(buildTryOnHtml(params.imageUrl, params.clothingType || "top")).current;

  useEffect(() => {
    // Animate panel open whenever its target height is known
    if (panelExpanded) {
      Animated.spring(panelHeight, {
        toValue: PANEL_FULL,
        useNativeDriver: false,
        friction: 12,
      }).start();
    }
  }, [PANEL_FULL]);

  const togglePanel = () => {
    const toValue = panelExpanded ? PANEL_COLLAPSED : PANEL_FULL;
    setPanelExpanded(!panelExpanded);
    Animated.spring(panelHeight, { toValue, useNativeDriver: false, friction: 12 }).start();
    Haptics.selectionAsync();
  };

  /* ── WebView message handler ── */
  const handleMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      switch (msg.type) {
        case "CAMERA_READY":
          setCameraReady(true);
          break;
        case "POSE_READY":
          setPoseReady(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case "ERROR":
          setCameraError(msg.message || "Camera unavailable");
          break;
      }
    } catch {}
  }, []);

  /* ── Switch outfit (inject into running WebView) ── */
  const switchOutfit = (imageUrl: string, title: string, clothingType: string, sizes: string[]) => {
    // Safely escape for JS string literal injection
    const safeUrl = imageUrl.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "");
    const safeType = clothingType.toLowerCase().replace(/[^a-z]/g, "");

    if (webViewRef.current) {
      // Must end with `true;` — React Native WebView requires a truthy return
      webViewRef.current.injectJavaScript(
        `window.setGarment('${safeUrl}','${safeType}');true;`
      );
    }
    setActiveProduct({ imageUrl, title, clothingType, sizes });
    setSizeResult(null);
    setSelectedSize(null);
    Haptics.selectionAsync();
  };

  /* ── Size calculation ── */
  const calculateSize = () => {
    if (!height || !weight) {
      Alert.alert("Missing measurements", "Enter your height and weight to get a recommendation.");
      return;
    }
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (isNaN(h) || isNaN(w) || h < 100 || h > 250 || w < 20 || w > 300) {
      Alert.alert("Invalid values", "Please enter realistic height (100–250 cm) and weight (20–300 kg).");
      return;
    }
    setCalcLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Use setTimeout so UI updates before computation
    setTimeout(() => {
      const result = recommendSizeLocally(h, w, gender, activeProduct.clothingType, activeProduct.sizes);
      setSizeResult(result);
      setSelectedSize(result.recommended);
      setCalcLoading(false);
      wardrobeService.updateMeasurements({ height: h, weight: w, gender }).catch(() => {});
    }, 50);
  };

  /* ── Expo Go fallback: WebView not available ── */
  if (isExpoGo || !WebView) {
    return (
      <View style={[styles.container, expoGoStyles.wrap]}>
        <LinearGradient colors={[`${Colors.primary}18`, "transparent"]} style={expoGoStyles.glow} />
        <View style={expoGoStyles.card}>
          <LinearGradient colors={Colors.gradient.primary} style={expoGoStyles.icon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="body" size={32} color={Colors.background} />
          </LinearGradient>
          <Text style={expoGoStyles.title}>Virtual Mirror</Text>
          <Text style={expoGoStyles.sub}>
            The AI body-tracking try-on requires a{"\n"}
            <Text style={{ color: Colors.primary, fontWeight: "700" }}>Development Build</Text> — it uses a native
            camera module not included in Expo Go.
          </Text>
          <View style={expoGoStyles.steps}>
            {[
              "Run: npx expo run:ios  (or run:android)",
              "Or build with EAS: eas build --profile development",
              "Install the build on your device and open it",
            ].map((s, i) => (
              <View key={i} style={expoGoStyles.step}>
                <View style={expoGoStyles.stepDot} />
                <Text style={expoGoStyles.stepText}>{s}</Text>
              </View>
            ))}
          </View>
          <Text style={expoGoStyles.note}>
            All other features (Wardrobe, Size Recommender, Browse) work fully in Expo Go.
          </Text>
        </View>
        <TouchableOpacity style={expoGoStyles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={16} color={Colors.text.secondary} />
          <Text style={expoGoStyles.backText}>Back to Wardrobe</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ── Render ── */
  return (
    <View style={styles.container}>

      {/* ── WebView: full screen virtual mirror ── */}
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={StyleSheet.absoluteFill}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
        mixedContentMode="always"
        allowsProtectedMedia
        mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
        onMessage={handleMessage}
        onError={() => setCameraError("Failed to load virtual mirror.")}
      />

      {/* ── Loading overlay ── */}
      {!poseReady && !cameraError && (
        <View style={styles.loadOverlay}>
          <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.loadCard}>
            <LinearGradient colors={[`${Colors.primary}18`, "transparent"]} style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={Colors.gradient.primary}
              style={styles.loadIcon}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Ionicons name="body" size={30} color={Colors.background} />
            </LinearGradient>
            <Text style={styles.loadTitle}>Starting Virtual Mirror</Text>
            <View style={styles.loadSteps}>
              {[
                { label: "Camera access",     done: cameraReady },
                { label: "MediaPipe Pose AI", done: poseReady },
                { label: "Garment overlay",   done: poseReady },
              ].map((s, i) => (
                <View key={i} style={styles.loadStep}>
                  <Ionicons
                    name={s.done ? "checkmark-circle" : "ellipse-outline"}
                    size={16}
                    color={s.done ? Colors.success : Colors.text.tertiary}
                  />
                  <Text style={[styles.loadStepText, s.done && styles.loadStepDone]}>{s.label}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.loadHint}>Stand 1–2 m from camera for best results</Text>
          </View>
        </View>
      )}

      {/* ── Camera error overlay ── */}
      {cameraError && (
        <View style={styles.loadOverlay}>
          <BlurView intensity={75} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[styles.loadCard, { gap: 14 }]}>
            <View style={[styles.loadIcon, { backgroundColor: `${Colors.error}22` }]}>
              <Ionicons name="camera-outline" size={30} color={Colors.error} />
            </View>
            <Text style={styles.loadTitle}>Camera unavailable</Text>
            <Text style={styles.loadHint}>{cameraError}</Text>
            <TouchableOpacity style={styles.errBack} onPress={() => router.back()} activeOpacity={0.85}>
              <Text style={styles.errBackText}>Go back</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Top bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity style={styles.topBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <BlurView intensity={65} tint="dark" style={styles.topBtnBlur}>
            <Ionicons name="chevron-back" size={22} color={Colors.white} />
          </BlurView>
        </TouchableOpacity>

        {poseReady && (
          <View style={styles.poseBadge}>
            <BlurView intensity={65} tint="dark" style={styles.poseBadgeBlur}>
              <View style={styles.poseDot} />
              <Text style={styles.poseBadgeText}>Live tracking</Text>
            </BlurView>
          </View>
        )}

        <TouchableOpacity
          style={styles.topBtn}
          onPress={() => { setShowSizePanel(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          activeOpacity={0.85}
        >
          <BlurView intensity={65} tint="dark" style={styles.topBtnBlur}>
            <Ionicons name="resize" size={20} color={sizeResult ? Colors.primary : Colors.white} />
          </BlurView>
        </TouchableOpacity>
      </View>

      {/* ── Bottom panel ── */}
      <Animated.View style={[styles.panel, { height: panelHeight, paddingBottom: insets.bottom + 6 }]}>
        <BlurView intensity={88} tint="dark" style={StyleSheet.absoluteFill} />

        {/* Drag handle / toggle */}
        <TouchableOpacity style={styles.panelHandle} onPress={togglePanel} activeOpacity={0.8}>
          <View style={styles.handleBar} />
        </TouchableOpacity>

        {/* Current item row */}
        <View style={styles.currentRow}>
          <Image
            source={{ uri: activeProduct.imageUrl }}
            style={styles.currentImg}
            contentFit="cover"
          />
          <View style={styles.currentMeta}>
            <Text style={styles.currentTitle} numberOfLines={2}>{activeProduct.title}</Text>
            {sizeResult ? (
              <View style={styles.recBadge}>
                <Ionicons name="sparkles" size={11} color={Colors.background} />
                <Text style={styles.recBadgeText}>Recommended: {sizeResult.recommended}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.sizeHintRow}
                onPress={() => setShowSizePanel(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="sparkles" size={13} color={Colors.primary} />
                <Text style={styles.sizeHintText}>Get AI size recommendation</Text>
                <Ionicons name="chevron-forward" size={13} color={Colors.primary} />
              </TouchableOpacity>
            )}
            {/* Size selector */}
            {activeProduct.sizes.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sizesScroll}>
                <View style={styles.sizesRow}>
                  {activeProduct.sizes.map((s) => {
                    const fitInfo = sizeResult?.allSizes.find((x) => x.size === s);
                    const isRec = sizeResult?.recommended === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.sizeChip,
                          selectedSize === s && styles.sizeChipSel,
                          isRec && styles.sizeChipRec,
                        ]}
                        onPress={() => { setSelectedSize(s); Haptics.selectionAsync(); }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.sizeChipText, selectedSize === s && styles.sizeChipTextSel]}>{s}</Text>
                        {isRec && <View style={styles.recDot} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </View>
        </View>

        {/* Outfit switcher (visible when expanded) */}
        {panelExpanded && items.length > 1 && (
          <View style={styles.switcher}>
            <Text style={styles.switcherLabel}>YOUR WARDROBE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.switcherScroll}>
              {items.map((item) => {
                const isActive = item.imageUrl === activeProduct.imageUrl;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.switchItem, isActive && styles.switchItemActive]}
                    onPress={() =>
                      switchOutfit(
                        item.imageUrl,
                        item.title,
                        item.clothingTypes[0] || "top",
                        item.sizes
                      )
                    }
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: item.imageUrl }} style={styles.switchImg} contentFit="cover" />
                    {isActive && <View style={styles.switchActiveDot} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </Animated.View>

      {/* ── Size Recommender modal ── */}
      <Modal
        visible={showSizePanel}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSizePanel(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOuter}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowSizePanel(false)} />
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>AI Size Recommender</Text>
                  <Text style={styles.modalSub}>Get a personalised fit prediction in seconds.</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setShowSizePanel(false)}
                >
                  <Ionicons name="close" size={20} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Gender */}
              <Text style={styles.fieldLabel}>FIT FOR</Text>
              <View style={styles.genderRow}>
                {(["male", "female", "unisex"] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderChip, gender === g && styles.genderChipActive]}
                    onPress={() => setGender(g)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={g === "male" ? "man-outline" : g === "female" ? "woman-outline" : "person-outline"}
                      size={15}
                      color={gender === g ? Colors.background : Colors.text.secondary}
                    />
                    <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                      {g === "male" ? "Men's" : g === "female" ? "Women's" : "Unisex"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Height / Weight */}
              <Text style={styles.fieldLabel}>YOUR MEASUREMENTS</Text>
              <View style={styles.measureRow}>
                <View style={styles.measureField}>
                  <View style={styles.measureInputWrap}>
                    <TextInput
                      style={styles.measureInput}
                      placeholder="170"
                      placeholderTextColor={Colors.text.tertiary}
                      keyboardType="decimal-pad"
                      value={height}
                      onChangeText={setHeight}
                    />
                    <Text style={styles.measureUnit}>cm</Text>
                  </View>
                  <Text style={styles.measureHint}>Height</Text>
                </View>
                <View style={styles.measureField}>
                  <View style={styles.measureInputWrap}>
                    <TextInput
                      style={styles.measureInput}
                      placeholder="65"
                      placeholderTextColor={Colors.text.tertiary}
                      keyboardType="decimal-pad"
                      value={weight}
                      onChangeText={setWeight}
                    />
                    <Text style={styles.measureUnit}>kg</Text>
                  </View>
                  <Text style={styles.measureHint}>Weight</Text>
                </View>
              </View>

              {/* Calculate button */}
              <TouchableOpacity
                style={styles.calcBtn}
                onPress={calculateSize}
                disabled={calcLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={Colors.gradient.primary}
                  style={styles.calcBtnInner}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  {calcLoading ? (
                    <Text style={styles.calcBtnText}>Calculating…</Text>
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={17} color={Colors.background} />
                      <Text style={styles.calcBtnText}>Calculate My Size</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Results */}
              {sizeResult && (
                <View style={styles.results}>
                  {/* Hero result */}
                  <View style={styles.resultHero}>
                    <LinearGradient colors={[Colors.primarySubtle, "transparent"]} style={StyleSheet.absoluteFill} />
                    <View>
                      <Text style={styles.resultSizeNum}>{sizeResult.recommended}</Text>
                      <Text style={styles.resultConf}>{sizeResult.confidence}% match</Text>
                    </View>
                    <View style={styles.resultStats}>
                      <View style={styles.resultStat}>
                        <Ionicons name="body-outline" size={14} color={Colors.text.tertiary} />
                        <Text style={styles.resultStatText}>Chest ~{sizeResult.chest} cm</Text>
                      </View>
                      <View style={styles.resultStat}>
                        <Ionicons name="ellipse-outline" size={14} color={Colors.text.tertiary} />
                        <Text style={styles.resultStatText}>Waist ~{sizeResult.waist} cm</Text>
                      </View>
                    </View>
                  </View>

                  {sizeResult.note && (
                    <View style={styles.noteRow}>
                      <Ionicons name="information-circle-outline" size={15} color={Colors.warning} />
                      <Text style={styles.noteText}>{sizeResult.note}</Text>
                    </View>
                  )}

                  {/* Fit guide */}
                  <Text style={styles.fieldLabel}>FIT GUIDE</Text>
                  <View style={styles.fitGrid}>
                    {sizeResult.allSizes
                      .filter((s) => activeProduct.sizes.length === 0 || activeProduct.sizes.includes(s.size))
                      .map(({ size, fit, label }) => (
                        <View
                          key={size}
                          style={[styles.fitChip, { borderColor: (FIT_COLORS[fit] ?? Colors.border) + "55" }]}
                        >
                          <Text style={[styles.fitSize, { color: FIT_COLORS[fit] ?? Colors.text.secondary }]}>
                            {size}
                          </Text>
                          <Text style={styles.fitLabel}>{label}</Text>
                        </View>
                      ))}
                  </View>

                  {/* Close CTA */}
                  <TouchableOpacity
                    style={styles.doneBtn}
                    onPress={() => setShowSizePanel(false)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.doneBtnText}>Done — back to mirror</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/* ─────────────────────────────────────────────
   Styles
───────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  /* Loading */
  loadOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", zIndex: 30 },
  loadCard: {
    width: W * 0.78, backgroundColor: Colors.surface,
    borderRadius: Radius.xxl, borderWidth: 1, borderColor: Colors.border,
    padding: 28, alignItems: "center", gap: 14, overflow: "hidden",
  },
  loadIcon: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  loadTitle: { ...Typography.title3, color: Colors.text.primary },
  loadSteps: { width: "100%", gap: 10 },
  loadStep: { flexDirection: "row", alignItems: "center", gap: 10 },
  loadStepText: { ...Typography.label, color: Colors.text.tertiary },
  loadStepDone: { color: Colors.text.primary },
  loadHint: { ...Typography.caption, color: Colors.text.tertiary, textAlign: "center" },
  errBack: {
    marginTop: 4, paddingHorizontal: 20, paddingVertical: 11,
    borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border,
  },
  errBackText: { ...Typography.label, color: Colors.text.secondary },

  /* Top bar */
  topBar: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
  },
  topBtn: { borderRadius: 22, overflow: "hidden" },
  topBtnBlur: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },

  poseBadge: { borderRadius: Radius.full, overflow: "hidden" },
  poseBadgeBlur: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  poseDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  poseBadgeText: { color: Colors.white, fontSize: 11, fontWeight: "600" },

  /* Bottom panel */
  panel: {
    position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20,
    borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl,
    borderTopWidth: 1, borderColor: Colors.border,
    overflow: "hidden", paddingHorizontal: Spacing.lg,
  },
  panelHandle: { alignItems: "center", paddingVertical: 10 },
  handleBar: { width: 38, height: 4, borderRadius: 2, backgroundColor: Colors.borderLight },

  currentRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  currentImg: { width: 60, height: 74, borderRadius: Radius.lg },
  currentMeta: { flex: 1, gap: 5 },
  currentTitle: { ...Typography.labelLarge, color: Colors.text.primary, lineHeight: 19 },

  recBadge: {
    flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start",
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  recBadgeText: { color: Colors.background, fontSize: 11, fontWeight: "800" },

  sizeHintRow: {
    flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start",
  },
  sizeHintText: { color: Colors.primary, ...Typography.caption, fontWeight: "600" },

  sizesScroll: { marginTop: 4 },
  sizesRow: { flexDirection: "row", gap: 6 },
  sizeChip: {
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: Radius.md,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    position: "relative",
  },
  sizeChipSel: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sizeChipRec: { borderColor: Colors.primary },
  sizeChipText: { color: Colors.text.secondary, fontSize: 12, fontWeight: "600" },
  sizeChipTextSel: { color: Colors.background, fontWeight: "800" },
  recDot: {
    position: "absolute", top: -2, right: -2,
    width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary,
  },

  switcher: { marginTop: 12, gap: 6 },
  switcherLabel: { ...Typography.labelSmall, color: Colors.text.tertiary, letterSpacing: 1 },
  switcherScroll: { gap: 8 },
  switchItem: {
    borderRadius: Radius.md, overflow: "hidden",
    borderWidth: 2, borderColor: "transparent", opacity: 0.65,
  },
  switchItemActive: { borderColor: Colors.primary, opacity: 1 },
  switchImg: { width: 50, height: 62 },
  switchActiveDot: {
    position: "absolute", bottom: 3, right: 3,
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary,
  },

  /* Modal */
  modalOuter: { flex: 1, justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl,
    borderTopWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingTop: 10,
    maxHeight: H * 0.88,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: "center", marginBottom: 12,
  },
  modalHeader: {
    flexDirection: "row", alignItems: "flex-start",
    justifyContent: "space-between", marginBottom: 20,
  },
  modalTitle: { ...Typography.title3, color: Colors.text.primary },
  modalSub: { ...Typography.body, color: Colors.text.secondary, marginTop: 4 },
  modalClose: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.card, alignItems: "center", justifyContent: "center",
  },

  fieldLabel: {
    ...Typography.labelSmall, color: Colors.text.tertiary,
    letterSpacing: 1, marginBottom: 10,
  },

  genderRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  genderChip: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 11, borderRadius: Radius.lg,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  genderChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  genderText: { ...Typography.label, color: Colors.text.secondary },
  genderTextActive: { color: Colors.background, fontWeight: "800" },

  measureRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  measureField: { flex: 1, gap: 6 },
  measureInputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, height: 52,
  },
  measureInput: {
    flex: 1, color: Colors.text.primary,
    fontSize: 20, fontWeight: "700",
  },
  measureUnit: { ...Typography.label, color: Colors.text.tertiary },
  measureHint: { ...Typography.caption, color: Colors.text.tertiary, textAlign: "center" },

  calcBtn: { borderRadius: Radius.xl, overflow: "hidden", marginBottom: 20 },
  calcBtnInner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 15,
  },
  calcBtnText: { color: Colors.background, ...Typography.labelLarge, fontWeight: "800" },

  results: { gap: 14 },
  resultHero: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: `${Colors.primary}30`,
    padding: Spacing.lg, overflow: "hidden",
  },
  resultSizeNum: { fontSize: 48, fontWeight: "900", color: Colors.primary, letterSpacing: -2 },
  resultConf: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 2 },
  resultStats: { gap: 6 },
  resultStat: { flexDirection: "row", alignItems: "center", gap: 6 },
  resultStatText: { ...Typography.label, color: Colors.text.secondary },
  noteRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: `${Colors.warning}10`, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: `${Colors.warning}28`,
  },
  noteText: { ...Typography.bodySmall, color: Colors.warning, flex: 1, lineHeight: 18 },
  fitGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  fitChip: {
    alignItems: "center", paddingHorizontal: 13, paddingVertical: 9,
    borderRadius: Radius.lg, borderWidth: 1, backgroundColor: Colors.card, gap: 3,
  },
  fitSize: { fontSize: 15, fontWeight: "800" },
  fitLabel: { fontSize: 9, color: Colors.text.tertiary, fontWeight: "600" },
  doneBtn: {
    alignItems: "center", paddingVertical: 13,
    borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border,
    marginTop: 4, marginBottom: 8,
  },
  doneBtnText: { ...Typography.label, color: Colors.text.secondary },
});

const expoGoStyles = StyleSheet.create({
  wrap: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  glow: {
    position: "absolute", top: 0, left: 0, right: 0, height: H * 0.4,
  },
  card: {
    width: "100%", backgroundColor: Colors.surface,
    borderRadius: Radius.xxl, borderWidth: 1, borderColor: Colors.border,
    padding: 24, alignItems: "center", gap: 14, overflow: "hidden",
  },
  icon: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  title: { ...Typography.title2, color: Colors.text.primary },
  sub: {
    ...Typography.body, color: Colors.text.secondary,
    textAlign: "center", lineHeight: 22,
  },
  steps: { width: "100%", gap: 10 },
  step: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  stepDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: Colors.primary, marginTop: 5, flexShrink: 0,
  },
  stepText: { ...Typography.bodySmall, color: Colors.text.secondary, flex: 1, lineHeight: 18 },
  note: {
    ...Typography.caption, color: Colors.text.tertiary,
    textAlign: "center", lineHeight: 17,
  },
  backBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    marginTop: 24, paddingVertical: 11, paddingHorizontal: 20,
    borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border,
  },
  backText: { ...Typography.label, color: Colors.text.secondary },
});
