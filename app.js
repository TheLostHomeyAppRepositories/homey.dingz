'use strict';

const MyHomey = require('my-homey');

const { DINGZ } = require('./lib/dingzAPI');

module.exports = class DingzApp extends MyHomey.App {

  async onInit() {
    super.onInit();
    this.onceDay = null;
  }

  // Web-API > DingzSwitchEvent
  async dingzSwitchEventAPI(params) {
    this.debug(`dingzSwitchEventAPI() - ${JSON.stringify(params)}`);
    switch (params.index) {
      case DINGZ.PIR:
        this.homey.emit(`dingzPirChanged-${params.mac}`, params);
        break;
      case DINGZ.BTN1:
      case DINGZ.BTN2:
      case DINGZ.BTN3:
      case DINGZ.BTN4:
        this.homey.emit(`dingzButtonPressed-${params.mac}`, params);
        // Workaround > Until the dingzSwitch sends an (output) refresh message
        this.homey.emit(`dingzRefresh-${params.mac}`, params);
        break;
      default:
    }
  }

  notifyDeviceWarning() {
    // Only once a day
    if (this.onceDay !== new Date().toLocaleDateString()) {
      this.onceDay = new Date().toLocaleDateString();
      this.notify('**WARNING:** Your dingz devices are no longer working properly. Please read the "[App][Pro] dingz" documentation');
    }
  }

};
