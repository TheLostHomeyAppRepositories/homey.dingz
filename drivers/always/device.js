'use strict';

const OutputDevice = require('../output');

module.exports = class AlwaysDevice extends OutputDevice {

  onInit(options = {}) {
    super.onInit(options);
  }

  onCapabilityOnOff(value, opts) {
    this.logDebug('onCapabilityOnOff() > nop');
  }

};
