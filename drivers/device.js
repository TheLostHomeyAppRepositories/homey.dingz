'use strict';

const Homey = require('homey');
const HttpAPI = require('../lib/httpAPI');

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

module.exports = class Device extends Homey.Device {

  static get DINGZ() {
    return DINGZ;
  }

  async onInit(options = {}) {
    this.debug('onInit()');

    this.ready()
      .then(() => this.deviceReady());

    this.setUnavailable(this.homey.__('connecting'));

    this.data = this.getData();
    this.httpAPI = new HttpAPI(this.homey, this._logLinePrefix());

    this.currentAddress = this.getStoreValue('address');
    this.homey.on('addressChanged', (discoveryResult) => {
      if (this.isActionForDevice(discoveryResult.data)) {
        this.currentAddress = discoveryResult.address;
        this.setStoreValue('address', discoveryResult.address).catch(this.error);
      }
    });
  }

  deviceReady() {
    return Promise.resolve()
      .then(this.log('Device ready'))
      .then(this.setAvailable())
      .then(this.getDeviceValues())
      .catch((err) => this.error(`deviceReady() > ${err}`));
  }

  getBaseURL() {
    return `http://${this.currentAddress}/api/v1/`;
  }

  // Homey Lifecycle
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

  // Homey Discovery
  onDiscoveryLastSeenChanged(discoveryResult) {
    this.debug(`onDiscoveryLastSeenChanged() discoveryResult: ${JSON.stringify(discoveryResult)}`);
    this.setAvailable()
      .catch((err) => this.error(`setAvailable() > ${err}`));
  }

  // Dingz action
  isActionForDevice(params) {
    return this.data.mac === params.mac;
  }

  // Data handling
  getDeviceValues(url = '**unknown**') {
    this.debug(`getDeviceValues() - '${url}'`);
    return this.getDeviceData(url);
  }

  getDeviceData(url) {
    return this.httpAPI.get(`${this.getBaseURL()}/${url}`)
      .then((json) => {
        this.debug(`getDeviceData() - '${url}' > ${JSON.stringify(json)}`);
        this.setAvailable()
          .catch((err) => this.error(`setAvailable() > ${err}`));
        return json;
      })
      .catch((err) => {
        this.error(`getDeviceData() - '${url}' > ${err}`);
        if (err.response.status === 404) {
          this.setUnavailable(this.homey.__('device.error', { code: err.response.status }));
        }
        throw new Error(`Get device data failed (${err.response.status})`);
      });
  }

  setDeviceData(url, value) {
    return this.httpAPI.post(`${this.getBaseURL()}/${url}`, value)
      .then((json) => {
        this.debug(`setDeviceData() - '${url}' > ${JSON.stringify(value) || ''}`);
        this.setAvailable()
          .catch((err) => this.error(`setAvailable() > ${err}`));
        return json;
      })
      .catch((err) => {
        this.error(`setDeviceData() - '${url}' ${JSON.stringify(value)} > ${err}`);
        if (err.response.status === 404) {
          this.setUnavailable(this.homey.__('device.error', { code: err.response.status }));
        }
        throw new Error(`Set device data failed (${err.response.status})`);
      });
  }

  async setCapabilityValue(capabilityId, value) {
    const currentValue = this.getCapabilityValue(capabilityId);
    if (currentValue === value) return Promise.resolve(currentValue);

    // eslint-disable-next-line no-return-await
    return await super.setCapabilityValue(capabilityId, value)
      .then(() => {
        this.debug(`setCapabilityValue() '${capabilityId}' - ${currentValue} > ${value}`);
        return value;
      })
      .catch((err) => {
        return this.error(`setCapabilityValue() '${capabilityId}' > ${err}`);
      });
  }

  //
  async updateSettingLabels() {
    this.debug('updateSettingLabels()');
    const labelName = this.getName();
    const labelAddress = this.currentAddress;
    const labelDeviceId = this.data.deviceId.replace(/^./, (str) => str.toUpperCase());
    await this.setSettings({ labelName, labelAddress, labelDeviceId });
  }

  showWarning(message) {
    return this.setWarning(message)
      .then(setTimeout(() => this.unsetWarning(), 3000))
      .catch((err) => this.error(`showWarning() > ${err}`));
  }

  // notify(msg) {
  //   // this.homey.notifications.createNotification({ excerpt: `**${this.getName()}** ${msg}` })
  //   this.log(`[notify] ${msg}`);
  // }

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
