'use strict';

const OutputDevice = require('../output');

const FADETIME = 5 * 60 * 1000; // Default 5 Min.

module.exports = class FanDevice extends OutputDevice {

  onInit(options = {}) {
    super.onInit(options);
  }

  onCapabilityOnOff(value, opts) {
    this.logDebug(`onCapabilityOnOff() > ${value} opts: ${JSON.stringify(opts)}`);

    const turn = value ? 'on' : 'off';
    const brightness = value ? 100 : 0;
    const fadetime = FADETIME;

    return this.sendCommand(`/light/${this.dataDevice}`, { turn, brightness, fadetime })
      .then(() => this.logNotice(`${this.homey.__('device.stateSet', { value: turn })}`))
      .catch((error) => {
        this.logError(`onCapabilityLight() > sendCommand > ${error}`);
        return Promise.reject(error);
      });
  }

};
