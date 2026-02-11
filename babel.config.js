module.exports = function (api) {
  api.cache(true);
  const plugins = [
    [
      "react-native-unistyles/plugin",
      {
        root: "app",
      },
    ],
    ["react-native-reanimated/plugin"],
  ];

  if (process.env.NODE_ENV === "production") {
    plugins.unshift(["transform-remove-console"]);
  }

  return {
    presets: ["babel-preset-expo"],
    plugins,
  };
};
