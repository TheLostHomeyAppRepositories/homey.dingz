'use strict';

const { MyHttpDevice } = require('my-homey');

const { DINGZ } = require('../lib/dingzAPI');

module.exports = class Device extends MyHttpDevice {

  #apiPath = null;

  static get DINGZ() {
    return DINGZ;
  }

  async onInit(options = {}) {
    super.onInit(options);

    this.#apiPath = `api/app/${this.homey.manifest.id}`;
  }

  initDevice() {
    return super.initDevice()
      .then(this.initDingzSwitchEvent())
      .then(this.setDingzSwitchSettings())
      .catch((err) => this.logError(`initDevice() > ${err}`));
  }

  // Homey Lifecycle

  onDeleted() {
    super.onDeleted();

    if (process.env.DEBUG === '1') {
      // Only for dingz Test
      // v1 this.unsubscribeDingzAction('dingzSwitchEvent', 'action/generic/generic/');
      // this.unsubscribeDingzAction('dingzSwitchEvent', 'action/generic/');
    }
  }

  // dingzSwitch event

  initDingzSwitchEvent() {
    this.logDebug('initDingzSwitchEvent()');

    // v1 this.subscribeDingzAction('dingzSwitchEvent', 'action/generic/generic/');
    this.subscribeDingzAction('dingzSwitchEvent', 'action/generic/');

    this.homey.on(`dingzRefresh-${this.data.mac}`, (params) => {
      this.logDebug(`dingzSwitchEvent: dingzRefresh > ${JSON.stringify(params)}`);
      this.getDeviceValues();
    });
  }

  // dingzSwitch action

  async subscribeDingzAction(action, url) {
    this.logDebug(`subscribeDingzAction() - ${action} > ${url}`);

    const localAddress = await this.homey.cloud.getLocalAddress();

    this.getDeviceData(url)
      .then((dingzActions) => {
        return dingzActions.generic
          .split('||')
          .filter((elm) => elm.length !== 0 && !elm.includes(this.#apiPath))
          .concat([`get://${localAddress}/${this.#apiPath}/${action}`])
          .join('||');
      })
      .then((dingzActions) => this.setDeviceData(url, dingzActions))
      .then(() => this.logDebug(`subscribeDingzAction() - ${action} subscribed`))
      .catch((err) => this.logError(`subscribeDingzAction() > ${err}`));
  }

  async unsubscribeDingzAction(action, url) {
    this.logDebug(`unsubscribeDingzAction() - ${action} > ${url}`);

    this.getDeviceData(url)
      .then((dingzActions) => {
        return dingzActions.url
          .split('||')
          .filter((elm) => elm.length !== 0 && !elm.includes(this.#apiPath))
          .join('||');
      })
      .then((dingzActions) => this.setDeviceData(url, dingzActions))
      .then(() => this.logDebug(`unsubscribeDingzAction() - ${action} unsubscribed`))
      .catch((err) => this.logError(`subscribeDingzAction() > ${err}`));
  }

  // Settings-Page

  async setDingzSwitchSettings() {
    this.logDebug('setDingzSwitchSettings()');
    await this.getDeviceData('device')
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
