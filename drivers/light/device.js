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
          .catch((err) => this.logError(`initDingzConfig() - ${err}`));
      }
    } else if (this.hasCapability('dim')) {
      await this.removeCapability('dim')
        .then(() => this.logDebug('initDingzConfig() - dim capability removed'))
        .catch((err) => this.logError(`initDingzConfig() - ${err}`));
    }
  }

  onCapabilityOnOff(value, opts) {
    this.logDebug(`onCapabilityOnOff() > ${value} opts: ${JSON.stringify(opts)}`);

    const turn = value ? 'on' : 'off';
    // const brightness = turn === 'on' ? 100 : 0;
    const fadetime = FADETIME;

    return this.sendCommand(`/light/${this.dataDevice}`, { turn, fadetime })
      .then(() => this.logNotice(`${this.homey.__('device.stateSet', { value: turn })}`))
      .catch((err) => {
        this.logError(`onCapabilityLight() > sendCommand > ${err}`);
        this.showWarning(err.message);
      });
  }

  onCapabilityDim(value, opts) {
    this.logDebug(`onCapabilityLight() > ${value} opts: ${JSON.stringify(opts)}`);

    const brightness = Math.round(value * 100);
    // const turn = brightness >= 1 ? 'on' : 'off';
    const fadetime = FADETIME;

    return this.sendCommand(`/light/${this.dataDevice}`, { brightness, fadetime })
      .then(() => this.logNotice(`${this.homey.__('device.dimSet', { value: brightness })}`))
      .catch((err) => {
        this.logError(`onCapabilityLight() > sendCommand > ${err}`);
        this.showWarning(err.message);
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
