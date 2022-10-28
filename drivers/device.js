'use strict';

const Homey = require('homey');
const Http = require('../lib/http');

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

const APP_PATH = 'api/app/org.cflat-inc.dingz';

module.exports = class Device extends Homey.Device {

  static get DINGZ() {
    return DINGZ;
  }

  async onInit(options = {}) {
    super.onInit();
    this.debug('onInit()');

    this.setUnavailable(this.homey.__('connecting'));

    this.data = this.getData();
    this.http = new Http(this.homey, { baseURL: this.getBaseURL() }, this._logLinePrefix());
  }

  ready() {
    return Promise.resolve(this.deviceReady());
  }

  async deviceReady() {
    try {
      await this.setAvailable();
      // .catch((err) => this.error(`setAvailable() > ${err}`));
      await this.getDeviceValues();
      this.log('Device ready');
    } catch {}
  }

  getBaseURL() {
    return `http://${this.getStoreValue('address')}/api/v1/`;
  }

  onDiscoveryAddressChanged(discoveryResult) {
    this.debug(`onDiscoveryAddressChanged() discoveryResult: ${JSON.stringify(discoveryResult)}`);
    this.setStoreValue('address', discoveryResult.address)
      .then(this.http.setBaseURL(this.getBaseURL()))
      .then(this.updateSettingLabels())
      .catch((err) => this.error(`onDiscoveryAddressChanged() > ${err}`));
  }

  onDiscoveryLastSeenChanged(discoveryResult) {
    this.debug(`onDiscoveryLastSeenChanged() discoveryResult: ${JSON.stringify(discoveryResult)}`);
    this.setAvailable()
      .catch((err) => {
        this.error(`setAvailable() > ${err}`);
      });
  }

  onAdded() {
    super.onAdded();
    this.updateSettingLabels();
    this.log('Device added');
  }

  onDeleted() {
    super.onDeleted();
    this.log('Device deleted');
  }

  onRenamed(name) {
    this.debug(`onRenamed() name: ${name}`);
    this.updateSettingLabels();
  }

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
      .then(() => this.debug(`subscribeDingzAction() "${action}" subscribed`))
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
      .then(() => this.debug(`unsubscribeDingzAction() "${action}" unsubscribed`))
      .catch((err) => {
        this.error(`unsubscribeDingzAction() > ${err}`);
        this.setUnavailable(err).catch((err) => {
          this.error(`setUnavailable() > ${err}`);
        });
      });
  }

  isActionForDevice(params) {
    return this.data.mac === params.mac;
  }

  async setCapabilityValue(capabilityId, value) {
    const currentValue = this.getCapabilityValue(capabilityId);
    if (currentValue === value) return Promise.resolve(currentValue);

    // eslint-disable-next-line no-return-await
    return await super
      .setCapabilityValue(capabilityId, value)
      .then(() => {
        this.debug(`setCapabilityValue() '${capabilityId}' - ${currentValue} > ${value}`);
        return value;
      })
      .catch((err) => {
        return this.error(`setCapabilityValue() '${capabilityId}' > ${err}`);
      });
  }

  getDeviceValues(url = '**unknown**') {
    this.debug(`getDeviceValues() - '${url}'`);
    return this.getDeviceData(url);
  }

  getDeviceData(url) {
    return this.http
      .get(url)
      .then((data) => {
        this.debug(`getDeviceData() - '${url}' > ${JSON.stringify(data)}`);
        this.setAvailable().catch((err) => {
          this.error(`setAvailable() > ${err}`);
        });
        return data;
      })
      .catch((err) => {
        this.error(`getDeviceData() - '${url}' > ${err}`);
        if (err.response.status === 404) {
          this.setUnavailable(this.homey.__('device.error', { code: err.response.status }));
        }
        return Promise.reject(new Error(`Get device data failed (${err.response.status})`));
      });
  }

  setDeviceData(url, value) {
    return this.http
      .post(url, value)
      .then((data) => {
        this.debug(`setDeviceData() - '${url}' > ${JSON.stringify(value) || ''}`);
        this.setAvailable().catch((err) => {
          this.error(`setAvailable() > ${err}`);
        });
        return data;
      })
      .catch((err) => {
        this.error(`setDeviceData() - '${url}' ${JSON.stringify(value)} > ${err}`);
        if (err.response.status === 404) {
          this.setUnavailable(this.homey.__('device.error', { code: err.response.status }));
        }
        return Promise.reject(new Error(`Set device data failed (${err.response.status})`));
      });
  }

  async updateSettingLabels() {
    this.debug('updateSettingLabels()');
    const labelName = this.getName();
    const labelAddress = this.getStoreValue('address');
    const labelDeviceId = this.data.deviceId.replace(/^./, (str) => str.toUpperCase());
    await this.setSettings({ labelName, labelAddress, labelDeviceId });
  }

  showWarning(message) {
    return this.setWarning(message)
      .then(setTimeout(() => this.unsetWarning(), 3000))
      .catch((err) => this.error(`showWarning() > ${err}`));
  }

  notify(msg) {
    // this.homey.notifications.createNotification({ excerpt: `**${this.getName()}** ${msg}` })
    this.log(`[notify] ${msg}`);
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
    return `${this.constructor.name}::${this.getName()}`;
  }

};
