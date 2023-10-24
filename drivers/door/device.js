'use strict';

const MotorDevice = require('../motor');

module.exports = class DoorDevice extends MotorDevice {

  onInit(options = {}) {
    super.onInit(options);
  }

  onTopicPosition(topic, data) {
    super.onTopicPosition(topic, data);

    this.setCapabilityValue('alarm_contact', data.position !== 100);
  }

};
