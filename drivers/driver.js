"use strict";

const Homey = require("homey");

module.exports = class Driver extends Homey.Driver {
  onInit(options = {}) {
    this.debug("onInit()");
    super.onInit();
  }

  // Homey-App Loggers
  log(msg) {
    Homey.app.log(`${this._logLinePrefix()} ${msg}`);
  }

  error(msg) {
    Homey.app.error(`${this._logLinePrefix()} ${msg}`);
  }

  debug(msg) {
    Homey.app.debug(`${this._logLinePrefix()} ${msg}`);
  }

  _logLinePrefix() {
    return `${this.constructor.name} >`;
  }
};
