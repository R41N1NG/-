"use strict";
const { images } = require("./generated/wardrobe-images.json");
function photoSource(file, thumb = false) {
  return (
    images[file] ||
    "user/images/wx_wardrobe/" +
      (thumb ? String(file).replace(/\.png$/, ".jpg") : file)
  );
}
module.exports = { photoSource };
