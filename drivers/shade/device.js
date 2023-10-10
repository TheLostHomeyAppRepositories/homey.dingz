'use strict';

const BaseDevice = require('../device');

module.exports = class ShadeDevice extends BaseDevice {

  onInit(options = {}) {
    super.onInit(options);

    this.registerCapabilityListener('windowcoverings_set', this.onCapabilityWindowCoveringsSet.bind(this));

    this.registerTopicListener(`/state/motor/${this.dataDevice}`, this.onTopicPosition.bind(this));
  }

  async onCapabilityWindowCoveringsSet(value, opts) {
    this.logDebug(`onCapabilityWindowCoveringsSet() - ${this.getCapabilityValue('windowcoverings_set')} > ${value}`);

    const position = value * 100;

    return this.sendCommand(`/motor/${this.dataDevice}`, { position })
      .then(() => this.logNotice(`${this.homey.__('device.windowCoveringsSet', { value: position })}`))
      .catch((error) => {
        this.logError(`onCapabilityWindowCoveringsSet() > sendCommand > ${error}`);
        this.showWarning(error.message);
        return Promise.reject(error);
      });
  }

  onTopicPosition(topic, data) {
    this.logDebug(`onTopicPosition() > ${topic} data: ${JSON.stringify(data)}`);

    this.setCapabilityValue('windowcoverings_set', Number((data.position / 100).toFixed(2)));

    if (data.position === data.goal) {
      this.logDebug('Device on position');
    }
  }

};
