const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add custom asset extensions
config.resolver.assetExts.push("pte");
config.resolver.assetExts.push("bin");

// Enable tree shaking and inline requires for smaller bundles and faster startup
// Also set EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH=1 and EXPO_UNSTABLE_TREE_SHAKING=1 for production builds
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: true,
    inlineRequires: true,
  },
});

module.exports = config;
