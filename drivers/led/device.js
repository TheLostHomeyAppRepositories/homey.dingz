'use strict';

const querystring = require('querystring');

const { DINGZ } = require('../../lib/dingzAPI');
const BaseDevice = require('../device');

module.exports = class LedDevice extends BaseDevice {

  onInit(options = {}) {
    super.onInit(options);

    this.registerCapabilityListener('onoff', this.onCapabilityOnOff.bind(this));
    this.registerMultipleCapabilityListener(['dim', 'ramp'], this.onCapabilityDim.bind(this));
    this.registerMultipleCapabilityListener(['light_hue', 'light_saturation'], this.onCapabilityLightHue.bind(this));
  }

  getDeviceValues(url = 'led/get') {
    return super.getDeviceValues(url)
      .then((data) => {
        this.setCapabilityValue('onoff', data.on);
        this.setCapabilityValue('light_hue', Math.round((1 / 360) * parseInt(data.hsv.split(';')[0], 10) * 100) / 100);
        this.setCapabilityValue('light_saturation', parseInt(data.hsv.split(';')[1], 10) / 100);
        this.setCapabilityValue('dim', parseInt(data.hsv.split(';')[2], 10) / 100);
        return data;
      })
      .catch((err) => {
        this.logError(`getDeviceValues() > ${err}`);
        this.showWarning(err.message);
      });
  }

  onCapabilityOnOff(value, opts) {
    const current = this.getCapabilityValue('onoff');
    if (current === value) return Promise.resolve();

    const action = value ? 'on' : 'off';
    const ramp = DINGZ.RAMP_DEFAULT * 100;

    this.logDebug(`onCapabilityOnOff() - ${current} > ${value}`);

    return this.setDeviceData('led/set', { action, ramp })
      .then(this.getDeviceValues())
      .then(this.deviceChanged(() => {
        const val = this.getCapabilityValue('onoff') ? 'on' : 'off';
        return this.homey.__('device.stateSet', { value: val });
      }))
      .catch((err) => this.logError(`onCapabilityOnOff() > ${err}`));
  }

  onCapabilityDim(valueObj, opts) {
    const current = this.getCapabilityValue('dim');
    const value = valueObj.dim;
    if (current === value) return Promise.resolve();

    const ramp = valueObj.ramp || DINGZ.RAMP_DEFAULT;
    const hue = this.getCapabilityValue('light_hue');
    const saturation = this.getCapabilityValue('light_saturation');
    const color = `${Math.round(hue * 360)};${Math.round(saturation * 100)};${Math.round(value * 100)}`;

    this.logDebug(`onCapabilityDim() - ${current} > ${value} ramp: ${ramp}`);

    return this.setDeviceData('led/set', {
      action: 'on', ramp, mode: 'hsv', color,
    })
      .then(this.getDeviceValues())
      .then(this.deviceChanged(() => {
        const val = Math.round(this.getCapabilityValue('dim') * 100);
        return this.homey.__('device.dimSet', { value: val });
      }))
      .catch((err) => this.logError(`onCapabilityDim() > ${err}`));
  }

  onCapabilityLightHue(valueObj, options) {
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

    this.logDebug(`onCapabilityLightHue() light_hue - ${curHue} > ${valHue} ramp: ${ramp}`);
    this.logDebug(`onCapabilityLightHue() light_saturation - ${curSaturation} > ${valSaturation}`);

    return this.setDeviceData('led/set', {
      action: 'on', ramp, mode: 'hsv', color,
    })
      .then(this.getDeviceValues())
      .then(this.deviceChanged(() => {
        const val = Math.round(this.getCapabilityValue('light_hue') * 360);
        return this.homey.__('device.lightHueSet', { value: val });
      }))
      .then(this.deviceChanged(() => {
        const val = Math.round(this.getCapabilityValue('light_saturation') * 100);
        return this.homey.__('device.lightSaturationSet', { value: val });
      }))
      .catch((err) => this.logError(`onCapabilityLightHue() > ${err}`));
  }

  onCapabilityDingzLedColor(valueObj, options) {
    this.logDebug(`onCapabilityDingzLedColor() - color: ${valueObj.color}`);
    return this.onCapabilityLightHue(JSON.parse(valueObj.color.replace(/'/g, '"')), options);
  }

  setDeviceData(url, data) {
    // Workaround > led does not correspond to the dingz-set api
    if (url === 'led/set') {
      data = querystring.stringify(data).split('%3B').join(';');
    }
    return super.setDeviceData(url, data);
  }

};
