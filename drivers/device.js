'use strict';

const { MyHttpDevice } = require('my-homey');

const { DINGZ } = require('../lib/dingzAPI');

module.exports = class BaseDevice extends MyHttpDevice {

  #apiPath = null;

  static get DINGZ() {
    return DINGZ;
  }

  async onInit(options = {}) {
    super.onInit(options);

    this.#apiPath = `api/app/${this.homey.manifest.id}`;
  }

  // MyHttpDevice

  getBaseURL() {
    return `http://${this.getStoreValue('address')}/api/v1/`;
  }

  initDevice() {
    return super.initDevice()
      .then(() => this.verifyFirmware())
      .then(() => this.setDingzSwitchSettings())
      .then(() => this.initDingzSwitchEvent());
  }

  verifyFirmware() {
    this.logDebug('verifyFirmware()');

    return this.getDeviceData('device')
      .then((data) => Object.values(data)[0])
      .then((device) => {
        if (!device.fw_version.startsWith('2.')) {
          throw Error('dingz firmware v2.x required');
        }
      });
  }

  // dingzSwitch event

  initDingzSwitchEvent() {
    this.logDebug('initDingzSwitchEvent()');

    this.homey.on(`dingzRefresh-${this.data.mac}`, (params) => {
      this.logDebug(`dingzSwitchEvent: dingzRefresh > ${JSON.stringify(params)}`);
      this.getDeviceValues();
    });

    this.subscribeDingzAction('action/generic/', 'dingzSwitchEvent');
  }

  //  dingzSwitch action

  async subscribeDingzAction(action, url) {
    this.logDebug(`subscribeDingzAction() > ${action}: ${url}`);

    const localAddress = await this.homey.cloud.getLocalAddress();

    await this.getDeviceData(action)
      .then((dingzActions) => {
        return dingzActions.generic // <<<
          .split('||')
          .filter((elm) => elm.length !== 0 && !elm.includes(this.#apiPath))
          .concat([`get://${localAddress}/${this.#apiPath}/${url}`])
          .join('||');
      })
      .then((dingzActions) => this.setDeviceData(action, dingzActions))
      .then(() => this.logDebug(`subscribeDingzAction() - ${action} subscribed`))
      .catch((err) => this.logError(`subscribeDingzAction() > ${err}`));
  }

  async subscribeDingzActionUrl(action, url) {
    this.logDebug(`subscribeDingzActionUrl() > ${action}: ${url}`);

    const localAddress = await this.homey.cloud.getLocalAddress();

    return this.getDeviceData(action)
      .then((dingzActions) => {
        return dingzActions.url // <<<
          .split('||')
          .filter((elm) => elm.length !== 0 && !elm.includes(this.#apiPath))
          .concat([`get://${localAddress}/${this.#apiPath}/${url}`])
          .join('||');
      })
      .then((dingzActions) => this.setDeviceData(action, dingzActions))
      .then(() => this.logDebug(`subscribeDingzActionUrl() > action: ${action} subscribed`))
      .catch((err) => this.logError(`subscribeDingzActionUrl() > ${err}`));
  }

  // Settings-Page

  async setDingzSwitchSettings() {
    this.logDebug('setDingzSwitchSettings()');
    return this.getDeviceData('device')
      .then((data) => this.setSettings({
        mac: Object.keys(data)[0],
        dip: Object.values(data)[0].dip_config.toString(),
        firmware: Object.values(data)[0].fw_version.toString(),
        frontModel: Object.values(data)[0].front_hw_model.toUpperCase(),
        baseModel: Object.values(data)[0].puck_hw_model.toUpperCase(),
      }))
      .catch((err) => this.logError(`setDingzSwitchSettings() > ${err}`));
  }

};
