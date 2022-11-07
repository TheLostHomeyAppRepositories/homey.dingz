'use strict';

const Homey = require('homey');
const HttpAPI = require('../lib/httpAPI');

module.exports = class Driver extends Homey.Driver {

  async onInit(options = {}) {
    this.debug('onInit()');

    this.ready()
      .then(() => this.driverReady());

    this.httpAPI = new HttpAPI(this.homey, this._logLinePrefix());
  }

  driverReady() {
    this.log('Driver ready');
  }

  // Homey-App Loggers
  log(msg) {
    this.homey.app.log(`${this._logLinePrefix()} > ${msg}`);
  }

  error(msg) {
    this.homey.app.error(`${this._logLinePrefix()} > ${msg}`);
  }

  debug(msg) {
    this.homey.app.debug(`${this._logLinePrefix()} > ${msg}`);
  }

  _logLinePrefix() {
    return `${this.constructor.name}`;
  }

};
