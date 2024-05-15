'use strict';

const BaseDevice = require('./device');

module.exports = class MotorDevice extends BaseDevice {

  onInit(options = {}) {
    super.onInit(options);

    this.registerCapabilityListener('windowcoverings_state', this.onCapabilityWindowCoveringsState.bind(this));
    this.registerCapabilityListener('windowcoverings_set', this.onCapabilityWindowCoveringsSet.bind(this));

    this.registerDeviceListener(`/state/motor/${this.dataDevice}`, this.onTopicState.bind(this));
    this.registerDeviceListener(`/power/motor/${this.dataDevice}`, this.onTopicPower.bind(this));
  }

  async initDingzConfig() {
    super.initDingzConfig();

    // TODO: migrate device to v2
    if (!this.hasCapability('windowcoverings_state')) {
      await this.addCapability('windowcoverings_state')
        .then(() => this.logDebug('initDingzConfig() - "windowcoverings_state" capability added'))
        .catch((error) => this.logError(`initDingzConfig() - ${error}`));
    }
    if (!this.hasCapability('measure_power')) {
      await this.addCapability('measure_power')
        .then(() => this.logDebug('initDingzConfig() - "measure_power" capability added'))
        .catch((error) => this.logError(`initDingzConfig() - ${error}`));
    }
  }

  async onCapabilityWindowCoveringsState(value, opts) {
    this.logDebug(`onCapabilityWindowCoveringsState() > ${value}`);

    // eslint-disable-next-line no-nested-ternary
    const motion = value === 'up' ? 1 : value === 'down' ? 2 : 0;

    return this.sendCommand(`/motor/${this.dataDevice}`, { motion })
      .then(() => this.logNotice(`Set state > ${value}`))
      .catch((error) => {
        this.logError(`onCapabilityGaragedoorClosed() > sendCommand > ${error}`);
        return Promise.reject(error);
      });
  }

  async onCapabilityWindowCoveringsSet(value, opts) {
    this.logDebug(`onCapabilityWindowCoveringsState() - ${this.getCapabilityValue('windowcoverings_set')} > ${value}`);

    const position = value * 100;

    return this.sendCommand(`/motor/${this.dataDevice}`, { position })
      .then(() => this.logNotice(`Set state > position: ${position}`))
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
