'use strict';

const { DINGZ } = require('../device');
const SwitchDevice = require('../switch/device');

module.exports = class LightDevice extends SwitchDevice {

  onInit(options = {}) {
    super.onInit(options);

    this.registerMultipleCapabilityListener(['dim', 'ramp'], this.onCapabilityDim.bind(this));
  }

  async onCapabilityDim(valueObj, opts) {
    const current = this.getCapabilityValue('dim');
    const value = valueObj.dim;
    if (current === value) return Promise.resolve();

    const dim = Math.round(value * 100);
    const ramp = (valueObj.ramp || DINGZ.RAMP_DEFAULT) * 10;

    this.debug(`onCapabilityDim() - ${current} > ${value} ramp: ${ramp}`);

    return this.setDeviceData(`dimmer/${this.data.relativeIdx}/on/?value=${dim}&ramp=${ramp}`)
      .then(await this.getDeviceValues())
      .then(() => {
        const val = Math.round(this.getCapabilityValue('dim') * 100);
        this.notify(this.homey.__('device.dimSet', { value: val }));
      })
      .catch((err) => this.error(`onCapabilityDim() > ${err}`));
  }

  async getDeviceValues(url) {
    return super
      .getDeviceValues(url)
      .then((data) => {
        this.setCapabilityValue('dim', data.value / 100);
        return data;
      })
      .catch((err) => {
        this.error(`getDeviceValues() > ${err}`);
        this.showWarning(err.message);
      });
  }

};
