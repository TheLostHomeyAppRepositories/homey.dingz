'use strict';

const BaseDevice = require('./device');

module.exports = class MotorDevice extends BaseDevice {

  TYPE_GROUP = 'motors';

  onInit(options = {}) {
    super.onInit(options);

    this.registerCapabilityListener('windowcoverings_state', this.onCapabilityWindowCoveringsState.bind(this));
    this.registerCapabilityListener('windowcoverings_set', this.onCapabilityWindowCoveringsSet.bind(this));

    this.registerTopicListener(`/state/motor/${this.dataDevice}`, this.onTopicState.bind(this));
    this.registerTopicListener(`/power/motor/${this.dataDevice}`, this.onTopicPower.bind(this));
  }

  async onCapabilityWindowCoveringsState(value, opts) {
    this.logDebug(`onCapabilityWindowCoveringsState() > ${value}`);

    // eslint-disable-next-line no-nested-ternary
    const motion = value === 'up' ? 1 : value === 'down' ? 2 : 0;

    return this.sendCommand(`/motor/${this.dataDevice}`, { motion })
      .then(() => this.logNotice(`${this.homey.__('device.windowCoveringsState', { value })}`))
      .catch((error) => {
        this.logError(`onCapabilityGaragedoorClosed() > sendCommand > ${error}`);
        return Promise.reject(error);
      });
  }

  async onCapabilityWindowCoveringsSet(value, opts) {
    this.logDebug(`onCapabilityWindowCoveringsState() - ${this.getCapabilityValue('windowcoverings_set')} > ${value}`);

    const position = value * 100;

    return this.sendCommand(`/motor/${this.dataDevice}`, { position })
      .then(() => this.logNotice(`${this.homey.__('device.windowCoveringsSet', { value: position })}`))
      .catch((error) => {
        this.logError(`onCapabilityWindowCoveringsSet() > sendCommand > ${error}`);
        return Promise.reject(error);
      });
  }

  onTopicState(topic, data) {
    this.logDebug(`onTopicState() > ${topic} data: ${JSON.stringify(data)}`);

    // eslint-disable-next-line no-nested-ternary
    this.setCapabilityValue('windowcoverings_state', data.motion === '1' ? 'up' : data.motion === '2' ? 'down' : 'idle');
    this.setCapabilityValue('windowcoverings_set', Number((data.position / 100).toFixed(2)));

    if (data.position === data.goal) {
      this.logDebug(`Device on position ${data.position}`);
    }
  }

  onTopicPower(topic, data) {
    this.logDebug(`onTopicPower() > ${topic} data: ${data}`);

    this.setCapabilityValue('measure_power', Math.round(data * 10) / 10);
  }

};
