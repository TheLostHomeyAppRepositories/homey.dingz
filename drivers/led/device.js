'use strict';

const tinycolor = require('tinycolor2');

const BaseDevice = require('../device');

module.exports = class LedDevice extends BaseDevice {

  async onInit(options = {}) {
    super.onInit(options);

    this.registerCapabilityListener('onoff', this.onCapabilityOnOff.bind(this));
    // this.registerCapabilityListener('dim', this.onCapabilityDim.bind(this)); // NOTE:: Currently not implemented
    this.registerMultipleCapabilityListener(['light_hue', 'light_saturation'], this.onCapabilityLightHue.bind(this));

    this.registerDeviceListener('/state/led', this.onTopicState.bind(this));

    // NOTE: Currently not implemented
    if (this.hasCapability('dim')) {
      await this.removeCapability('dim')
        .then(() => this.logDebug('onInit() - dim capability removed'))
        .catch((error) => this.logError(`onInit() - ${error}`));
    }
  }

  onCapabilityOnOff(value, opts) {
    this.logDebug(`onCapabilityOnOff() > ${value} opts: ${JSON.stringify(opts)}`);

    const onValue = value ? 1 : 0;

    return this.sendCommand('/led', { on: onValue })
      .then(() => this.logNotice(`Set state > ${value ? 'On' : 'Off'}`))

      .catch((error) => {
        this.logError(`onCapabilityOnOff() > sendCommand > ${error}`);
        return Promise.reject(error);
      });
  }

  onCapabilityDim(value, opts) {
    this.logDebug(`onCapabilityDim() > ${value} opts: ${JSON.stringify(opts)}`);

    const error = Error('Dim is currently not supported');
    this.showWarning(error.message);
    // return Promise.reject(error);

    // const brightness = value * 100;
    // if (brightness < 1 && this.getCapabilityValue('onoff')) {
    //   this.triggerCapabilityListener('onoff', false);
    // } else if (brightness > 0 && !this.getCapabilityValue('onoff')) {
    //   this.triggerCapabilityListener('onoff', true);
    // }

    // return this.sendCommand('/led', { on: brightness })
    //   .then(() => this.logNotice(`Set state > brightness: ${brightness}`))
    //   .catch((error) => {
    //     this.logError(`onCapabilityOnOff() > sendCommand > ${error}`);
    //     this.showWarning(error.message);
    //     return Promise.reject(error);
    //   });
  }

  onCapabilityLightHue(valueObj, opts) {
    this.logDebug(`onCapabilityLightHue() > ${JSON.stringify(valueObj)} opts: ${JSON.stringify(opts)}`);

    const hue = (typeof valueObj.light_hue !== 'undefined') ? valueObj.light_hue : this.getCapabilityValue('light_hue');
    const saturation = (typeof valueObj.light_saturation !== 'undefined') ? valueObj.light_saturation : this.getCapabilityValue('light_saturation');
    // const color = tinycolor.fromRatio({ h: hue, s: saturation, v: this.getCapabilityValue('dim') * 100 }); NOTE: Currently not implemented
    const color = tinycolor.fromRatio({ h: hue, s: saturation, v: 100 });

    return this.sendCommand('/led', color.toRgb())
      .then(() => this.triggerCapabilityListener('onoff', true))
      .then(() => this.logNotice(`Set state > color: ${color.toString()}`))
      .catch((error) => {
        this.logError(`onCapabilityLightHue() > sendCommand > ${error}`);
        return Promise.reject(error);
      });
  }

  onTopicState(topic, data) {
    this.logDebug(`onTopicState() > ${topic} data: ${JSON.stringify(data)}`);

    const color = tinycolor({ r: data.r, g: data.g, b: data.b });
    const hsv = color.toHsv();
    const hue = Number((hsv.h / 359).toFixed(2));
    const saturation = Number(hsv.s.toFixed(2));

    this.setCapabilityValue('onoff', data.on !== 0);
    // this.setCapabilityValue('dim', (data.on === 0 ? 0 : 100) / 100); // NOTE: Currently not implemented
    this.setCapabilityValue('light_hue', hue);
    this.setCapabilityValue('light_saturation', saturation);
  }

};
