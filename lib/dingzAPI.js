'use strict';

const { SimpleClass } = require('homey');

// DingzConstants
const DINGZ = {
  // default
  RAMP_DEFAULT: '1',
  // params > index
  BTN1: '1',
  BTN2: '2',
  BTN3: '3',
  BTN4: '4',
  PIR: '5',
  INPUT: '6',
  // params > action
  SHORT_PRESS: '1',
  DOUBLE_PRESS: '2',
  LONG_PRESS: '3',
  PRESS: '8',
  RELEASE: '9',

  BTN_1CLIC: '1',
  BTN_2CLICS: '2',
  // ? BTN_3CLICS: "3",
  BTN_4CLICS: '4',
  BTN_5CLICS: '5',
  BTN_PRESS: '8',
  BTN_RELEASE: '9',
  // Motion
  MOTION_START: '8',
  MOTION_STOP: '9',
  MOTION_NIGHT: '14',
  MOTION_TWILIGHT: '15',
  MOTION_DAY: '16',
  // Light state
  LIGHT_STATE_DAY: 'day',
  LIGHT_STATE_TWILIGHT: 'twilight',
  LIGHT_STATE_NIGHT: 'night',
};

// Not used  for dingzSwitch FW: 1.4x
class DingzBroadcast extends SimpleClass {

  constructor(homey, name = '###') {
    super();

    this.homey = homey;
    this.app_path = `api/app/${this.homey.manifest.id}`;
  }

  // Homey-App Loggers
  log(msg) {
    this.homey.app.log(`${this._logLinePrefix()}-${msg}`);
  }

  error(msg) {
    this.homey.app.error(`${this._logLinePrefix()}-${msg}`);
  }

  debug(msg) {
    // Only for http-api tests
    this.homey.app.debug(`${this._logLinePrefix()}-${msg}`);
  }

  _logLinePrefix() {
    return `${this.getName()} > HttpAPI`;
  }

}

module.exports = { DINGZ, DingzBroadcast };
