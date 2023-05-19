'use strict';

const { MyDriver } = require('my-homey');

module.exports = class BaseDriver extends MyDriver {

  onInit(options = {}) {
    super.onInit(options);
  }

  // NOTE: simplelog-api on/off

  // logError(msg) {
  //   if (process.env.DEBUG === '1') {
  //     this.error(`[ERROR] ${msg}}`);
  //   } else {
  //     this.error(msg);
  //   }
  // }

  // logInfo(msg) {
  //   this.log(`[INFO] ${msg}`);
  // }

  // logDebug(msg) {
  //   this.log(`[DEBUG] ${msg}`);
  // }

};
