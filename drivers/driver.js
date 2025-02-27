'use strict';

const { MyDriver } = require('my-homey');

module.exports = class BaseDriver extends MyDriver {

  onInit(options = {}) {
    super.onInit(options);
  }

};
