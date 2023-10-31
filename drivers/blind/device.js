'use strict';

const MotorDevice = require('../motor');

module.exports = class BlindDevice extends MotorDevice {

  onInit(options = {}) {
    super.onInit(options);

    this.registerCapabilityListener('windowcoverings_tilt_set', this.onCapabilityWindowCoveringsTiltSet.bind(this));
  }

  async onCapabilityWindowCoveringsTiltSet(value, opts) {
    this.logDebug(`onCapabilityWindowCoveringsTiltSet() - ${this.getCapabilityValue('windowcoverings_tilt_set')} > ${value}`);

    const lamella = value * 100;

    return this.sendCommand(`/motor/${this.dataDevice}`, { lamella })
      .then(() => this.logNotice(`Set state > lamella: ${lamella}`))
      .catch((error) => {
        this.logError(`onCapabilityWindowCoveringsTiltSet() > sendCommand > ${error}`);
        return Promise.reject(error);
      });
  }

  onTopicState(topic, data) {
    super.onTopicState(topic, data);

    this.setCapabilityValue('windowcoverings_tilt_set', Number((data.lamella / 100).toFixed(2)));
  }

};
