'use strict';

const Homey = require('homey');

const { DINGZ } = require('../lib/dingzAPI');
const HttpAPI = require('../lib/httpAPI');

module.exports = class Device extends Homey.Device {

  static get DINGZ() {
    return DINGZ;
  }

  get data() {
    return this.getData();
  }

  async onInit(options = {}) {
    this.debug('onInit()');

    this.ready()
      .then(() => this.deviceReady());

    this.setUnavailable(this.homey.__('connecting'));

    this.httpAPI = new HttpAPI(this.homey, this.getStoreValue('address'), this._logLinePrefix());
  }

  deviceReady() {
    return Promise.resolve()
      .then(this.log('Device ready'))
      .then(this.setAvailable())
      .then(this.setDingzSwitchSettings())
      .then(this.getDeviceValues())
      .catch((err) => this.error(`deviceReady() > ${err}`));
  }

  // Homey Lifecycle
  onAdded() {
    super.onAdded();
    this.log('Device added');
  }

  onDeleted() {
    super.onDeleted();
    this.log('Device deleted');
  }

  onRenamed(name) {
    this.debug(`onRenamed() to: ${name}`);
  }

  // Homey Discovery
  onDiscoveryResult(discoveryResult) {
    // this.debug(`onDiscoveryResult() > ${JSON.stringify(discoveryResult)}`);
    return discoveryResult.mac === this.data.mac;
  }

  onDiscoveryAvailable(discoveryResult) {
    this.debug('onDiscoveryAvailable()');
    this.setAvailable()
      .catch((err) => this.error(`onDiscoveryAvailable() > ${err}`));
  }

  onDiscoveryAddressChanged(discoveryResult) {
    this.log(`dingzSwitch changed to: ${discoveryResult.address}`);
    this.setStoreValue('address', discoveryResult.address)
      .then(this.httpAPI.setAddress(discoveryResult.address))
      .then(this.setSettings({ address: discoveryResult.address }))
      .catch((err) => this.error(`onDiscoveryAddressChanged() > ${err}`));
  }

  onDiscoveryLastSeenChanged(discoveryResult) {
    this.debug('onDiscoveryLastSeenChanged()');
    this.setSettings({ lastSeen: this.driver.localDateTimeFormater().format(new Date(discoveryResult.lastSeen)) })
      .catch((err) => this.error(`onDiscoveryLastSeenChanged() > ${err}`));
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
    return this.httpAPI.get(url)
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
    return this.httpAPI.post(url, value)
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

  async setDingzSwitchSettings() {
    this.debug('setDingzSwitchSettings()');
    await this.getDeviceData('device')
      .then((data) => this.setSettings({
        mac: Object.keys(data)[0],
        dip: Object.values(data)[0].dip_config.toString(),
        firmware: Object.values(data)[0].fw_version.toString(),
        frontModel: Object.values(data)[0].front_hw_model.toUpperCase(),
        baseModel: Object.values(data)[0].puck_hw_model.toUpperCase(),
      }))
      .catch((err) => this.error(`setDingzSwitchSettings() > ${err}`));
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
