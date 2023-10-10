'use strict';

const { MySimpleClass } = require('my-homey');

// Not used  for dingzSwitch FW: 1.4x
class DingzSwitchEvent extends MySimpleClass {

  constructor(homey, name = '###') {
    super();

    this.homey = homey;
    this.app_path = `api/app/${this.homey.manifest.id}`;
  }

}

// DingzConstants
const DINGZ = {
  // v2
  SHORT_PRESS: 'm1',
  DOUBLE_PRESS: 'm2',
  LONG_PRESS: 'r',

  // old
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

module.exports = { DINGZ, DingzSwitchEvent };
