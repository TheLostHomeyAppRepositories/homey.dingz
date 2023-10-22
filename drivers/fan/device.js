'use strict';

const BaseDevice = require('../device');

const FADETIME = 5 * 60 * 1000; // Default 5 Min.

module.exports = class FanDevice extends BaseDevice {

  TYPE_GROUP = 'outputs';

  onInit(options = {}) {
    super.onInit(options);

    this.registerCapabilityListener('onoff', this.onCapabilityOnOff.bind(this));
    this.registerCapabilityListener('dim', this.onCapabilityDim.bind(this));

    this.registerTopicListener(`/state/light/${this.dataDevice}`, this.onTopicLight.bind(this));
    this.registerTopicListener(`/power/light/${this.dataDevice}`, this.onTopicPower.bind(this));
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

  onCapabilityDim(value, opts) {
    this.logDebug(`onCapabilityLight() > ${value} opts: ${JSON.stringify(opts)}`);

    const turn = value > 0 ? 'on' : 'off';
    const brightness = Math.round(value * 100);
    const fadetime = FADETIME;

    return this.sendCommand(`/light/${this.dataDevice}`, { turn, brightness, fadetime })
      .then(() => this.logNotice(`${this.homey.__('device.dimSet', { value: brightness })}`))
      .catch((error) => {
        this.logError(`onCapabilityLight() > sendCommand > ${error}`);
        return Promise.reject(error);
      });
  }

  onTopicLight(topic, data) {
    this.logDebug(`onTopicLight() > ${topic} data: ${JSON.stringify(data)}`);

    this.setCapabilityValue('onoff', data.turn === 'on');
    this.setCapabilityValue('dim', data.brightness / 100);
  }

  onTopicPower(topic, data) {
    this.logDebug(`onTopicPower() > ${topic} data: ${data}`);

    this.setCapabilityValue('measure_power', Math.round(data * 10) / 10);
  }

};
