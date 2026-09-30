const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Bundle Drizzle's generated .sql migration files.
config.resolver.sourceExts.push("sql");

module.exports = config;
