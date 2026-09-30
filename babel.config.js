module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Lets Drizzle's generated .sql migrations be imported as strings.
    plugins: [["inline-import", { extensions: [".sql"] }]],
  };
};
