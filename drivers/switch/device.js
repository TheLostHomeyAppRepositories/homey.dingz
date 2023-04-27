'use strict';

const { DINGZ } = require('../../lib/dingzAPI');
const Device = require('../device');

module.exports = class SwitchDevice extends Device {

  onInit(options = {}) {
    super.onInit(options);

    this.registerCapabilityListener('onoff', this.onCapabilityOnOff.bind(this));

    this.homey.on(`measurePowerChanged-${this.data.mac}`, (params) => {
      if (params.output.toString() === this.data.absoluteIdx) {
        // this.logDebug(`dingzEvent: measurePowerChanged > ${JSON.stringify(params)`);
        this.setCapabilityValue('measure_power', Math.round(params.value * 10) / 10);
      }
    });
  }

  async getDeviceValues(url = `dimmer/${this.data.relativeIdx}`) {
    return super.getDeviceValues(url)
      .then((data) => {
        this.setCapabilityValue('onoff', data.on);
        return data;
      })
      .catch((err) => {
        this.logError(`getDeviceValues() > ${err}`);
        this.showWarning(err.message);
      });
  }

  async onCapabilityOnOff(value, opts) {
    const current = this.getCapabilityValue('onoff');
    if (current === value) return Promise.resolve();

    const action = value ? 'on' : 'off';
    const ramp = (this.data.deviceId === 'switch' ? 0 : DINGZ.RAMP_DEFAULT) * 10;

    this.logDebug(`onCapabilityOnOff() - ${current} > ${value}`);

    return this.setDeviceData(`dimmer/${this.data.relativeIdx}/${action}/?ramp=${ramp}`)
      .then(this.getDeviceValues())
      .then(this.notify(() => {
        const val = this.getCapabilityValue('onoff') ? 'on' : 'off';
        return this.homey.__('device.stateSet', { value: val });
      }))
      .catch((err) => this.logError(`onCapabilityOnOff() > ${err}`));
  }

};
