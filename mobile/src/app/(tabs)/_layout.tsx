import { Tabs } from "expo-router";
import { View, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@constants/colors";

type IoniconName = keyof typeof Ionicons.glyphMap;

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconName;
  activeIcon: IoniconName;
}

const TABS: TabConfig[] = [
  { name: "index",    title: "Home",     icon: "home-outline",    activeIcon: "home" },
  { name: "explore",  title: "Explore",  icon: "search-outline",  activeIcon: "search" },
  { name: "wardrobe", title: "",         icon: "shirt-outline",   activeIcon: "shirt" },
  { name: "rate",     title: "Rate",     icon: "star-outline",    activeIcon: "star" },
  { name: "profile",  title: "Profile",  icon: "person-outline",  activeIcon: "person" },
];

const TabBarBackground = () =>
  Platform.OS === "ios" ? (
    <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
  ) : (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface }]} />
  );

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.text.tertiary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: TabBarBackground,
      }}
    >
      {TABS.map(({ name, title, icon, activeIcon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ focused, color, size }) =>
              name === "wardrobe" ? (
                <View style={styles.mirrorBtn}>
                  <Ionicons name="shirt" size={24} color={Colors.background} />
                </View>
              ) : (
                <Ionicons
                  name={focused ? activeIcon : icon}
                  size={focused ? size + 1 : size}
                  color={color}
                />
              ),
          }}
        />
      ))}

      {/* Upload is accessible via the Home header + button */}
      <Tabs.Screen name="upload" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    height: Platform.OS === "ios" ? 84 : 70,
    paddingBottom: Platform.OS === "ios" ? 24 : 10,
    paddingTop: 10,
    elevation: 0,
    backgroundColor: "transparent",
  },
  tabLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.3, marginTop: 2 },
  mirrorBtn: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 10,
  },
});
