'use strict';

const tinycolor = require('tinycolor2');

const BaseDevice = require('../device');

module.exports = class LedDevice extends BaseDevice {

  onInit(options = {}) {
    super.onInit(options);

    this.registerCapabilityListener('onoff', this.onCapabilityOnOff.bind(this));
    // this.registerCapabilityListener('dim', this.onCapabilityDim.bind(this)); TODO: Dim ??
    this.registerMultipleCapabilityListener(['light_hue', 'light_saturation'], this.onCapabilityLightHue.bind(this));

    this.registerTopicListener('/state/led', this.onTopicLight.bind(this));
  }

  onCapabilityOnOff(value, opts) {
    this.logDebug(`onCapabilityOnOff() > ${value} opts: ${JSON.stringify(opts)}`);

    const onValue = value ? 1 : 0;

    return this.sendCommand('/led', { on: onValue })
      .then(() => this.logNotice(`${this.homey.__('device.stateSet', { value: value ? 'On' : 'Off' })}`))
      .catch((error) => {
        this.logError(`onCapabilityOnOff() > sendCommand > ${error}`);
        this.showWarning(error.message);
        return Promise.reject(error);
      });
  }

  onCapabilityDim(value, opts) {
    this.logDebug(`onCapabilityDim() > ${value} opts: ${JSON.stringify(opts)}`);

    const brightness = value * 100;
    if (brightness < 1 && this.getCapabilityValue('onoff')) {
      this.triggerCapabilityListener('onoff', false);
    } else if (brightness > 0 && !this.getCapabilityValue('onoff')) {
      this.triggerCapabilityListener('onoff', true);
    }

    return this.sendCommand('/led', { on: brightness })
      .then(() => this.logNotice(`${this.homey.__('device.dimSet', { value: brightness })}`))
      .catch((error) => {
        this.logError(`onCapabilityOnOff() > sendCommand > ${error}`);
        this.showWarning(error.message);
        return Promise.reject(error);
      });
  }

  onCapabilityLightHue(valueObj, opts) {
    this.logDebug(`onCapabilityLightHue() > ${JSON.stringify(valueObj)} opts: ${JSON.stringify(opts)}`);

    const hue = (typeof valueObj.light_hue !== 'undefined') ? valueObj.light_hue : this.getCapabilityValue('light_hue');
    const saturation = (typeof valueObj.light_saturation !== 'undefined') ? valueObj.light_saturation : this.getCapabilityValue('light_saturation');
    const color = tinycolor.fromRatio({ h: hue, s: saturation, v: 100 }); // NOTE: Workaround until iolo has implemented dim
    // const color = tinycolor.fromRatio({ h: hue, s: saturation, v: this.getCapabilityValue('dim') * 100 });

    return this.sendCommand('/led', color.toRgb())
      .then(() => this.triggerCapabilityListener('onoff', true))
      .then(() => this.logNotice(`${this.homey.__('device.lightHueSet', { value: color.toHsvString() })}`))
      .catch((error) => {
        this.logError(`onCapabilityLightHue() > sendCommand > ${error}`);
        this.showWarning(error.message);
        return Promise.reject(error);
      });
  }

  onTopicLight(topic, data) {
    this.logDebug(`onTopicLight() > ${topic} data: ${JSON.stringify(data)}`);

    const color = tinycolor({ r: data.r, g: data.g, b: data.b });
    const hsv = color.toHsv();
    const hue = Number((hsv.h / 359).toFixed(2));
    const saturation = Number(hsv.s.toFixed(2));

    this.setCapabilityValue('onoff', data.on !== 0);
    this.setCapabilityValue('dim', data.on === 0 ? 0 : 100); // NOTE: Workaround until iolo has implemented dim
    this.setCapabilityValue('light_hue', hue);
    this.setCapabilityValue('light_saturation', saturation);
  }

};
