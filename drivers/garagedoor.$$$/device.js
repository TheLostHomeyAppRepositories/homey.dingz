'use strict';

const BaseDevice = require('../device');

module.exports = class WindowDevice extends BaseDevice {

  onInit(options = {}) {
    super.onInit(options);

    this.registerCapabilityListener('garagedoor_closed', this.onCapabilityGaragedoorClosed.bind(this));
    this.registerCapabilityListener('windowcoverings_set', this.onCapabilityWindowCoveringsSet.bind(this));

    this.registerTopicListener(`/state/motor/${this.dataDevice}`, this.onTopicPosition.bind(this));
  }

  async onCapabilityGaragedoorClosed(value, opts) {
    this.logDebug(`onCapabilityGaragedoorClosed() > ${value}`);

    const position = value ? 100 : 0;

    return this.sendCommand(`/motor/${this.dataDevice}`, { position })
      .then(() => this.logNotice(`${this.homey.__('device.garagedoorClosed', { value: position })}`))
      .catch((error) => {
        this.logError(`onCapabilityGaragedoorClosed() > sendCommand > ${error}`);
        return Promise.reject(error);
      });
  }

  async onCapabilityWindowCoveringsSet(value, opts) {
    this.logDebug(`onCapabilityWindowCoveringsSet() - ${this.getCapabilityValue('windowcoverings_set')} > ${value}`);

    const position = value * 100;

    return this.sendCommand(`/motor/${this.dataDevice}`, { position })
      .then(() => this.logNotice(`${this.homey.__('device.windowCoveringsSet', { value: position })}`))
      .catch((error) => {
        this.logError(`onCapabilityWindowCoveringsSet() > sendCommand > ${error}`);
        return Promise.reject(error);
      });
  }

  onTopicPosition(topic, data) {
    this.logDebug(`onTopicPosition() > ${topic} data: ${JSON.stringify(data)}`);

    this.setCapabilityValue('garagedoor_closed', data.position === 100);
    this.setCapabilityValue('windowcoverings_set', Number((data.position / 100).toFixed(2)));

    if (data.position === data.goal) {
      this.logDebug('Device on position');
    }
  }

};
