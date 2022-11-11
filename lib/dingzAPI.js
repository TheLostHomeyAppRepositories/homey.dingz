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

// Dingz[Message]Bus
const APP_PATH = 'api/app/org.cflat-inc.dingzX';

class DingzBus extends SimpleClass {

  constructor(homey, name = '###') {
    super();

    this.subscribeDingzAction('dingzGenAction', 'action/generic/generic/');

    this.homey.on('dingzGenAction', (params) => {
      if (this.isActionForDevice(params)) {
        this.debug(`dingzActionEvent: dingzGenAction > ${JSON.stringify(params)}`);
        switch (params.index) {
          case DINGZ.PIR:
            this.homey.emit('dingzPirGenAction', params);
            break;
          case DINGZ.BTN1:
          case DINGZ.BTN2:
          case DINGZ.BTN3:
          case DINGZ.BTN4:
            this.homey.emit('dingzButtonGenAction', params);
            break;
          default:
        }
      }
    });

    this.homey.on('unload', async () => {
      this.debug('homeyEvent: unload');
      this.unsubscribeDingzAction('dingzGenAction', 'action/generic/generic/');
    });

    this.debug('Initialized');
  }

  // Dingz action
  async subscribeDingzAction(action, url) {
    this.debug(`subscribeDingzAction() - ${action} > ${url}`);

    this.getDeviceData(url)
      .then(async (dingzActions) => {
        return dingzActions.url
          .split('||')
          .filter((elm) => elm.length !== 0 && !elm.includes(APP_PATH))
          .concat([`get://${this.homey.app.homeyAddress}/${APP_PATH}/${action}`])
          .join('||');
      })
      .then((dingzActions) => this.setDeviceData(url, dingzActions))
      .then(() => this.debug(`subscribeDingzAction() - ${action} subscribed`))
      .catch((err) => {
        this.error(`subscribeDingzAction() > ${err}`);
        this.setUnavailable(err).catch((err) => {
          this.error(`setUnavailable() > ${err}`);
        });
      });
  }

  async unsubscribeDingzAction(action, url) {
    this.debug(`unsubscribeDingzAction() - ${action} > ${url}`);

    this.getDeviceData(url)
      .then((dingzActions) => {
        return dingzActions.url
          .split('||')
          .filter((elm) => elm.length !== 0 && !elm.includes(APP_PATH))
          .join('||');
      })
      .then((dingzActions) => this.setDeviceData(url, dingzActions))
      .then(() => this.debug(`unsubscribeDingzAction() - ${action} unsubscribed`))
      .catch((err) => {
        this.error(`unsubscribeDingzAction() > ${err}`);
        this.setUnavailable(err).catch((err) => {
          this.error(`setUnavailable() > ${err}`);
        });
      });
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

module.exports = { DINGZ, DingzBus };
