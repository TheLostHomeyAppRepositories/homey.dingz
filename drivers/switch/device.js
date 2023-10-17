'use strict';

const BaseDevice = require('../device');

module.exports = class SwitchDevice extends BaseDevice {

  TYPE_GROUP = 'outputs';

  onInit(options = {}) {
    super.onInit(options);

    this.registerCapabilityListener('onoff', this.onCapabilityOnOff.bind(this));

    this.registerTopicListener(`/state/light/${this.dataDevice}`, this.onTopicOnOff.bind(this));
    this.registerTopicListener(`/power/light/${this.dataDevice}`, this.onTopicPower.bind(this));
  }

  onCapabilityOnOff(value, opts) {
    this.logDebug(`onCapabilityOnOff() > ${value} opts: ${JSON.stringify(opts)}`);

    const turn = value ? 'on' : 'off';

    return this.sendCommand(`/light/${this.dataDevice}`, { turn })
      .then(() => this.logNotice(`${this.homey.__('device.stateSet', { value: turn })}`))
      .catch((error) => {
        this.logError(`onCapabilityLight() > sendCommand > ${error}`);
        this.showWarning(error.message);
      });
  }

  onTopicOnOff(topic, data) {
    this.logDebug(`onTopicOnOff() > ${topic} data: ${JSON.stringify(data)}`);

    this.setCapabilityValue('onoff', data.turn === 'on');
  }

  onTopicPower(topic, data) {
    this.logDebug(`onTopicPower() > ${topic} data: ${data}`);

    this.setCapabilityValue('measure_power', Math.round(data * 10) / 10);
  }

};
