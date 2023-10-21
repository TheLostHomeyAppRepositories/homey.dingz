'use strict';

const BaseDevice = require('../device');

module.exports = class BlindDevice extends BaseDevice {

  onInit(options = {}) {
    super.onInit(options);

    this.registerCapabilityListener('windowcoverings_set', this.onCapabilityWindowCoveringsSet.bind(this));
    this.registerCapabilityListener('windowcoverings_tilt_set', this.onCapabilityWindowCoveringsTiltSet.bind(this));

    this.registerTopicListener(`/state/motor/${this.dataDevice}`, this.onTopicPosition.bind(this));
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

  async onCapabilityWindowCoveringsTiltSet(value, opts) {
    this.logDebug(`onCapabilityWindowCoveringsTiltSet() - ${this.getCapabilityValue('windowcoverings_tilt_set')} > ${value}`);

    const lamella = value * 100;

    return this.sendCommand(`/motor/${this.dataDevice}`, { lamella })
      .then(() => this.logNotice(`${this.homey.__('device.windowCoveringsSet', { value: lamella })}`))
      .catch((error) => {
        this.logError(`onCapabilityWindowCoveringsTiltSet() > sendCommand > ${error}`);
        return Promise.reject(error);
      });
  }

  onTopicPosition(topic, data) {
    this.logDebug(`onTopicPosition() > ${topic} data: ${JSON.stringify(data)}`);

    this.setCapabilityValue('windowcoverings_set', Number((data.position / 100).toFixed(2)));
    this.setCapabilityValue('windowcoverings_tilt_set', Number((data.lamella / 100).toFixed(2)));

    if (data.position === data.goal) {
      this.logDebug('Device on position');
    }
  }

};
