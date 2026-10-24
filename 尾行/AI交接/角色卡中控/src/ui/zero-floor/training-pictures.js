"use strict";
const { shots } = require("../generated/training-shots.json");
const { createScreenshotPictures } = require("./screenshot-pictures.js");
function createTrainingPictures(options) {
  return createScreenshotPictures({ ...options, shots });
}
module.exports = { createTrainingPictures };
