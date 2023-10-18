'use strict';

const BaseDevice = require('../device');

module.exports = class PulseDevice extends BaseDevice {

  TYPE_GROUP = 'outputs';

  onInit(options = {}) {
    super.onInit(options);

    // this.registerTopicListener(`/power/light/${this.dataDevice}`, this.onTopicPower.bind(this));
  }

  onTopicPower(topic, data) {
    this.logDebug(`onTopicPower() > ${topic} data: ${data}`);

    this.setCapabilityValue('measure_power', Math.round(data * 10) / 10);
  }

};
