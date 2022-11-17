'use strict';

const Homey = require('homey');
const { HomeyAPIApp } = require('homey-api');

const { DINGZ } = require('./lib/dingzAPI');

/* eslint-disable */
if (process.env.DEBUG === '1') {
  require('inspector').open(9229, '0.0.0.0', false);
  // require('inspector').open(9229, '0.0.0.0', true);
}
/* eslint-enable */

module.exports = class DingzApp extends Homey.App {

  async onInit() {
    this.log(`${this.homey.manifest.name.en} app - v${this.homey.manifest.version} is running...`);

    this.api = new HomeyAPIApp({ homey: this.homey });
    this.systemInfo = await this.api.system.getInfo();
    this.homeyAddress = this.systemInfo.wifiAddress.split(':')[0];
    this.debug(`homeyAddress: ${this.homeyAddress}`);
  }

  // Web-API > DingzBroadcast
  async dingzBroadcastAPI(params) {
    this.debug(`dingzBroadcastAPI() - ${JSON.stringify(params)}`);
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

  // Homey-App Loggers
  log(msg) {
    super.log(msg);
  }

  error(msg) {
    super.error(`${msg}`);
  }

  debug(msg) {
    // Show the debug message only in debug mode.
    if (process.env.DEBUG === '1') {
      super.log(`[DEBUG] ${msg}`);
    }
  }

};
