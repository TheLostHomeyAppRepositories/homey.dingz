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

    this.app_path = `api/app/${this.homey.manifest.id}`;
    this.httpAPI = new HttpAPI(this.homey, this.getStoreValue('address'), this._logLinePrefix());

    this.setUnavailable(this.homey.__('connecting'));

    this.ready()
      .then(this.initDevice())
      .then(this.setAvailable())
      .then(this.log('Device ready'));
  }

  initDevice() {
    return Promise.resolve()
      .then(this.getDeviceValues())
      .then(this.initDingzSwitchEvent())
      .then(this.setDingzSwitchSettings())
      .catch((err) => this.error(`initDevice() > ${err}`));
  }

  initDingzSwitchEvent() {
    this.debug('initDingzSwitchEvent()');

    this.subscribeDingzAction('dingzSwitchEvent', 'action/generic/generic/');

    this.homey.on(`dingzRefresh-${this.data.mac}`, (params) => {
      this.debug(`dingzSwitchEvent: dingzRefresh > ${JSON.stringify(params)}`);
      this.getDeviceValues();
    });

    this.homey.on('unload', async () => {
      this.debug('homeyEvent: unload');
      this.unsubscribeDingzAction('dingzSwitchEvent', 'action/generic/generic/');
    });
  }

  // Homey Lifecycle
  onAdded() {
    super.onAdded();
    this.log('Device added');
  }

  onDeleted() {
    super.onDeleted();
    // Only for dingzX Test
    // if (process.env.DEBUG === '1') {
    //   this.unsubscribeDingzAction('dingzSwitchEvent', 'action/generic/generic/');
    // }
    this.log('Device deleted');
  }

  onRenamed(name) {
    this.log(`Device renamed to ${name}`);
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

  async subscribeDingzAction(action, url) {
    this.debug(`subscribeDingzAction() - ${action} > ${url}`);
    const localAddress = await this.homey.cloud.getLocalAddress();

    this.getDeviceData(url)
      .then((dingzActions) => {
        return dingzActions.url
          .split('||')
          .filter((elm) => elm.length !== 0 && !elm.includes(this.app_path))
          .concat([`get://${localAddress}/${this.app_path}/${action}`])
          .join('||');
      })
      .then((dingzActions) => this.setDeviceData(url, dingzActions))
      .then(() => this.debug(`subscribeDingzAction() - ${action} subscribed`))
      .catch((err) => this.error(`subscribeDingzAction() > ${err}`));
  }

  async unsubscribeDingzAction(action, url) {
    this.debug(`unsubscribeDingzAction() - ${action} > ${url}`);

    this.getDeviceData(url)
      .then((dingzActions) => {
        return dingzActions.url
          .split('||')
          .filter((elm) => elm.length !== 0 && !elm.includes(this.app_path))
          .join('||');
      })
      .then((dingzActions) => this.setDeviceData(url, dingzActions))
      .then(() => this.debug(`unsubscribeDingzAction() - ${action} unsubscribed`))
      .catch((err) => this.error(`subscribeDingzAction() > ${err}`));
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
        this._handelHttpError(err);
        throw new Error(`Get device-data failed (${(err.response && err.response.status) || err.code})`);
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
        this._handelHttpError(err);
        throw new Error(`Set device data failed (${(err.response && err.response.status) || err.code})`);
      });
  }

  _handelHttpError(err) {
    if (err.response) {
      if (err.response.status === 404) {
        this.setUnavailable(this.homey.__('device.error', { msg: `Path not found '${err.request.path}'` }));
      } else {
        this.setUnavailable(this.homey.__('device.error', { msg: err }));
      }
    } else if (err.request) {
      if (err.code === 'EHOSTUNREACH' || err.code === 'ENETUNREACH') {
        this.setUnavailable(this.homey.__('device.offline'));
      } else {
        this.setUnavailable(this.homey.__('device.error', { msg: err.code }));
      }
    }
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

  notify(msg) {
    setTimeout(() => {
      msg = (typeof msg !== 'function') ? msg : msg();
      // this.homey.notifications.createNotification({ excerpt: `**${this.getName()}** ${msg}` })
      this.homey.app.log(`[NOTIFY] ${this._logLinePrefix()} > ${msg}`);
    }, 1000);
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
