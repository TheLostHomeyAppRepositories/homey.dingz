'use strict';

const { MyDriver } = require('my-homey');

module.exports = class Driver extends MyDriver {

  async onInit(options = {}) {
    super.onInit(options);
  }

};
