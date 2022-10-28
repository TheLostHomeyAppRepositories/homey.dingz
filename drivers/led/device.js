'use strict';

const querystring = require('querystring');

const { DINGZ } = require('../device');
const Device = require('../device');

const GET_URL = 'led/get';
const SET_URL = 'led/set';

module.exports = class LedDevice extends Device {

  onInit(options = {}) {
    super.onInit(options);

    this.registerCapabilityListener('onoff', this.onCapabilityOnOff.bind(this));
    this.registerMultipleCapabilityListener(['dim', 'ramp'], this.onCapabilityDim.bind(this));
    this.registerMultipleCapabilityListener(['light_hue', 'light_saturation'], this.onCapabilityLightHue.bind(this));
  }

  handleDeviceAction(params) {
    // nop
  }

  async onCapabilityOnOff(value, opts) {
    const current = this.getCapabilityValue('onoff');
    if (current === value) return Promise.resolve();

    const action = value ? 'on' : 'off';
    const ramp = DINGZ.RAMP_DEFAULT * 100;

    this.debug(`onCapabilityOnOff() - ${current} > ${value}`);

    return this.setDeviceData(SET_URL, { action, ramp })
      .then(await this.getDeviceValues())
      .then(() => {
        const val = this.getCapabilityValue('onoff') ? 'on' : 'off';
        this.notify(this.homey.__('device.stateSet', { value: val }));
      })
      .catch((err) => this.error(`onCapabilityOnOff() > ${err}`));
  }

  async onCapabilityDim(valueObj, opts) {
    const current = this.getCapabilityValue('dim');
    const value = valueObj.dim;
    if (current === value) return Promise.resolve();

    const ramp = valueObj.ramp || DINGZ.RAMP_DEFAULT;
    const hue = this.getCapabilityValue('light_hue');
    const saturation = this.getCapabilityValue('light_saturation');
    const color = `${Math.round(hue * 360)};${Math.round(saturation * 100)};${Math.round(value * 100)}`;

    this.debug(`onCapabilityDim() - ${current} > ${value} ramp: ${ramp}`);

    return this.setDeviceData(SET_URL, {
      action: 'on', ramp, mode: 'hsv', color,
    })
      .then(await this.getDeviceValues())
      .then(() => {
        const val = Math.round(this.getCapabilityValue('dim') * 100);
        this.notify(this.homey.__('device.dimSet', { value: val }));
      })
      .catch((err) => this.error(`onCapabilityDim() > ${err}`));
  }

  async onCapabilityLightHue(valueObj, options) {
    const curHue = this.getCapabilityValue('light_hue');
    const valHue = valueObj.light_hue || curHue;
    const curSaturation = this.getCapabilityValue('light_saturation');
    const valSaturation = valueObj.saturation || curSaturation;
    if (!(curHue !== valHue || curSaturation !== valSaturation)) return Promise.resolve(true);

    const ramp = valueObj.ramp || DINGZ.RAMP_DEFAULT;
    const hue = Math.round(valHue * 360);
    const saturation = Math.round(valSaturation * 100);
    const dim = Math.round(this.getCapabilityValue('dim') * 100);
    const color = `${hue};${saturation};${dim}`;

    this.debug(`onCapabilityLightHue() light_hue - ${curHue} > ${valHue} ramp: ${ramp}`);
    this.debug(`onCapabilityLightHue() light_saturation - ${curSaturation} > ${valSaturation}`);

    return this.setDeviceData(SET_URL, {
      action: 'on', ramp, mode: 'hsv', color,
    })
      .then(await this.getDeviceValues())
      .then(() => {
        const val = Math.round(this.getCapabilityValue('light_hue') * 360);
        this.notify(this.homey.__('device.lightHueSet', { value: val }));
      })
      .then(() => {
        const val = Math.round(this.getCapabilityValue('light_saturation') * 100);
        this.notify(this.homey.__('device.lightSaturationSet', { value: val }));
      })
      .catch((err) => this.error(`onCapabilityLightHue() > ${err}`));
  }

  async getDeviceValues(url = GET_URL) {
    return super
      .getDeviceValues(url)
      .then((data) => {
        this.setCapabilityValue('onoff', data.on);
        this.setCapabilityValue('light_hue', Math.round((1 / 360) * parseInt(data.hsv.split(';')[0], 10) * 100) / 100);
        this.setCapabilityValue('light_saturation', parseInt(data.hsv.split(';')[1], 10) / 100);
        this.setCapabilityValue('dim', parseInt(data.hsv.split(';')[2], 10) / 100);
        return data;
      })
      .catch((err) => {
        this.error(`getDeviceValues() > ${err}`);
        this.showWarning(err.message);
      });
  }

  setDeviceData(url, data) {
    return super.setDeviceData(url, querystring.stringify(data).split('%3B').join(';'));
  }

};
