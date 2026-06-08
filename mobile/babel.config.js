module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: {
            "@": "./src",
            "@components": "./src/components",
            "@hooks": "./src/hooks",
            "@services": "./src/services",
            "@store": "./src/store",
            "@constants": "./src/constants",
            "@utils": "./src/utils",
            "@models": "./src/types",
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
