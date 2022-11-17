'use strict';

const { DINGZ } = require('../../lib/dingzAPI');
const Device = require('../device');

module.exports = class SwitchDevice extends Device {

  onInit(options = {}) {
    super.onInit(options);

    this.registerCapabilityListener('onoff', this.onCapabilityOnOff.bind(this));

    this.homey.on('measurePowerChanged', (params) => {
      if (params.output.toString() === this.data.absoluteIdx) {
        // this.debug(`dingzEvent: measurePowerChanged > ${JSON.stringify(params)`);
        this.setCapabilityValue('measure_power', Math.round(params.value * 10) / 10);
      }
    });
  }

  async getDeviceValues(url = `dimmer/${this.data.relativeIdx}`) {
    return super.getDeviceValues(url)
      .then(async (data) => {
        await this.setCapabilityValue('onoff', data.on);
        return data;
      })
      .catch((err) => {
        this.error(`getDeviceValues() > ${err}`);
        this.showWarning(err.message);
      });
  }

  async onCapabilityOnOff(value, opts) {
    const current = this.getCapabilityValue('onoff');
    if (current === value) return Promise.resolve();

    const action = value ? 'on' : 'off';
    const ramp = (this.data.deviceId === 'switch' ? 0 : DINGZ.RAMP_DEFAULT) * 10;

    this.debug(`onCapabilityOnOff() - ${current} > ${value}`);

    return this.setDeviceData(`dimmer/${this.data.relativeIdx}/${action}/?ramp=${ramp}`)
      .then(this.getDeviceValues())
      .catch((err) => this.error(`onCapabilityOnOff() > ${err}`));
  }

};
