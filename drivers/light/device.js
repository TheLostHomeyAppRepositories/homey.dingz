'use strict';

const BaseDevice = require('../device');

const FADETIME = 10;

module.exports = class LightDevice extends BaseDevice {

  TYPE_GROUP = 'outputs';

  async onInit(options = {}) {
    super.onInit(options);

    this.registerCapabilityListener('onoff', this.onCapabilityOnOff.bind(this));
    this.registerCapabilityListener('dim', this.onCapabilityDim.bind(this));

    this.registerTopicListener(`/state/light/${this.dataDevice}`, this.onTopicLight.bind(this));
    this.registerTopicListener(`/power/light/${this.dataDevice}`, this.onTopicPower.bind(this));
  }

  async initDingzConfig() {
    super.initDingzConfig();

    if (this.dingzConfig.light.dimmable) {
      if (!this.hasCapability('dim')) {
        await this.addCapability('dim')
          .then(() => this.logDebug('initDingzConfig() - dim capability added'))
          .catch((error) => this.logError(`initDingzConfig() - ${error}`));
      }
    } else if (this.hasCapability('dim')) {
      await this.removeCapability('dim')
        .then(() => this.logDebug('initDingzConfig() - dim capability removed'))
        .catch((error) => this.logError(`initDingzConfig() - ${error}`));
    }
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

    if (this.hasCapability('dim')) {
      this.setCapabilityValue('dim', data.brightness / 100);
    }
  }

  onTopicPower(topic, data) {
    this.logDebug(`onTopicPower() > ${topic} data: ${data}`);

    this.setCapabilityValue('measure_power', Math.round(data * 10) / 10);
  }

};
