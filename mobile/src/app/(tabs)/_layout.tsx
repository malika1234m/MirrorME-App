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
  { name: "upload",   title: "",         icon: "add",             activeIcon: "add" },
  { name: "wardrobe", title: "Wardrobe", icon: "shirt-outline",   activeIcon: "shirt" },
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
              name === "upload" ? (
                <View style={styles.uploadBtn}>
                  <Ionicons name="add" size={26} color={Colors.background} />
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
  uploadBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
});
