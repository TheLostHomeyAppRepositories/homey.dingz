'use strict';

const OutputDevice = require('../output');

module.exports = class GaragedoorDevice extends OutputDevice {

  onInit(options = {}) {
    super.onInit(options);

    this.registerCapabilityListener('garagedoor_closed', this.onCapabilityGaragedoorClosed.bind(this));
  }

  onCapabilityOnOff(value, opts) {
    this.logDebug('onCapabilityOnOff() > nop');
  }

  async onCapabilityGaragedoorClosed(value, opts) {
    this.logDebug(`onCapabilityGaragedoorClosed() > ${value}`);

    const position = value ? 100 : 0;

    return this.sendCommand(`/light/${this.dataDevice}`, { position })
      .then(() => this.logNotice(`${this.homey.__('device.garagedoorClosed', { value: position })}`))
      .catch((error) => {
        this.logError(`onCapabilityGaragedoorClosed() > sendCommand > ${error}`);
        return Promise.reject(error);
      });
  }

  onTopicState(topic, data) {
    this.logDebug(`onTopicState() > ${topic} data: ${JSON.stringify(data)}`);

    this.setCapabilityValue('garagedoor_closed', data.position === 100);
  }

};
