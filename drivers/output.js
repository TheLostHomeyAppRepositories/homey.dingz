'use strict';

const BaseDevice = require('./device');

module.exports = class OutputDevice extends BaseDevice {

  onInit(options = {}) {
    super.onInit(options);

    this.registerCapabilityListener('onoff', this.onCapabilityOnOff.bind(this));

    this.registerTopicListener(`/state/light/${this.dataDevice}`, this.onTopicState.bind(this));
    this.registerTopicListener(`/power/light/${this.dataDevice}`, this.onTopicPower.bind(this));
  }

  onCapabilityOnOff(value, opts) {
    this.logDebug(`onCapabilityOnOff() > ${value} opts: ${JSON.stringify(opts)}`);

    const turn = value ? 'on' : 'off';

    return this.sendCommand(`/light/${this.dataDevice}`, { turn })
      .then(() => this.logNotice(`Set state > ${turn}`))
      .catch((error) => {
        this.logError(`onCapabilityLight() > sendCommand > ${error}`);
        return Promise.reject(error);
      });
  }

  async onTopicState(topic, data) {
    this.logDebug(`onTopicState() > ${topic} data: ${JSON.stringify(data)}`);

    if (data.exception !== 0) {
      this.logError('dingzSwitch overloaded');
    }

    this.setCapabilityValue('onoff', data.turn === 'on');
  }

  onTopicPower(topic, data) {
    this.logDebug(`onTopicPower() > ${topic} data: ${data}`);

    this.setCapabilityValue('measure_power', Math.round(data * 10) / 10);
  }

};
