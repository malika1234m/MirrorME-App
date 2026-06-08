const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Force CJS resolution: some deps (e.g. zustand) ship an ESM build using
// `import.meta`, which breaks Expo's static web export — the bundle is loaded
// via a classic <script> tag (not type="module"), so `import.meta` throws a
// SyntaxError and the app never mounts (stuck on the loading screen).
config.resolver.unstable_conditionNames = ["require", "react-native", "default"];

module.exports = config;
