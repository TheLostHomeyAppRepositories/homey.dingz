'use strict';

const MotorDevice = require('../motor');

module.exports = class WindowDevice extends MotorDevice {

  onInit(options = {}) {
    super.onInit(options);
  }

  onTopicState(topic, data) {
    super.onTopicState(topic, data);

    this.setCapabilityValue('alarm_contact', data.position !== 100);
  }

};
