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
    this.log(`${Homey.app.manifest.name.en}-App - v${Homey.app.manifest.version} is running...`);
  }

  // Homey-App Loggers
  log(msg) {
    super.log(msg);
  }

  error(msg) {
    super.error(`${msg}`);
  }

  debug(msg) {
    super.log(`»»» ${msg}`);
  }
};
