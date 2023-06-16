'use strict';

const { MyApp } = require('my-homey');

const { DINGZ } = require('./lib/dingzAPI');

module.exports = class DingzApp extends MyApp {

  onInit() {
    super.onInit();
    this.onceDay = null;
  }

  // Web-API > DingzSwitchEvent
  dingzSwitchEventAPI(params) {
    this.logDebug(`dingzSwitchEventAPI() > params: ${JSON.stringify(params)}`);
    switch (params.index) {
      case DINGZ.PIR:
        this.homey.emit(`dingzPirChanged-${params.mac}`, params);
        break;
      case DINGZ.BTN1:
      case DINGZ.BTN2:
      case DINGZ.BTN3:
      case DINGZ.BTN4:
        if (params.action <= 3) {
          this.homey.emit(`dingzButtonPressed-${params.mac}`, params);
          // Workaround > Until the dingzSwitch sends an (output) refresh message
          this.homey.emit(`dingzRefresh-${params.mac}`, params);
        }
        break;
      default:
    }
  }

  notifyDeviceWarning() {
    // Only once a day
    if (this.onceDay !== new Date().toLocaleDateString()) {
      this.onceDay = new Date().toLocaleDateString();
      this.notifyError('Your dingz devices are no longer working properly. Please read the "[App][Pro] dingz" documentation');
    }
  }

  // NOTE: simplelog-api on/off

  logDebug(msg) {
    if (process.env.DEBUG === '1') {
      super.logDebug(msg);
    }
  }

};
