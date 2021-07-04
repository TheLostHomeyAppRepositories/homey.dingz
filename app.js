"use strict";

/**
 * homey-debugger
 */

/* eslint-disable */
if (process.env.DEBUG === "1") {
  require("inspector").open(9229, "0.0.0.0", false);
  // require("inspector").open(9229, "0.0.0.0", true);
}
/* eslint-enable */

const Homey = require("homey");

module.exports = class dingzApp extends Homey.App {
  onInit() {
    this.log(`${Homey.app.manifest.name.en} app - v${Homey.app.manifest.version} is running...`);
  }

  // Homey-App Loggers
  log(msg) {
    super.log(msg);
  }

  error(msg) {
    super.error(`${msg}`);
  }

  debug(msg) {
    // Show the debug message only in debug mode.
    if (process.env.DEBUG === "1") {
      super.log(`[DEBUG] ${msg}`);
    }
  }
};
