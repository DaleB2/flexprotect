module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"], // Router support is baked in on SDK 50+
  };
};
