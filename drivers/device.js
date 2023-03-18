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
      .catch((err) => this.error(`initDevice() > ${err}`));
  }

  // Homey Lifecycle

  onDeleted() {
    super.onDeleted();

    if (process.env.DEBUG === '1') {
      // Only for dingz Test
      // this.unsubscribeDingzAction('dingzSwitchEvent', 'action/generic/generic/');
    }
  }

  // dingzSwitch event

  initDingzSwitchEvent() {
    this.debug('initDingzSwitchEvent()');

    this.subscribeDingzAction('dingzSwitchEvent', 'action/generic/generic/');

    this.homey.on(`dingzRefresh-${this.data.mac}`, (params) => {
      this.debug(`dingzSwitchEvent: dingzRefresh > ${JSON.stringify(params)}`);
      this.getDeviceValues();
    });
  }

  // dingzSwitch action

  async subscribeDingzAction(action, url) {
    this.debug(`subscribeDingzAction() - ${action} > ${url}`);

    const localAddress = await this.homey.cloud.getLocalAddress();

    this.getDeviceData(url)
      .then((dingzActions) => {
        return dingzActions.url
          .split('||')
          .filter((elm) => elm.length !== 0 && !elm.includes(this.#apiPath))
          .concat([`get://${localAddress}/${this.#apiPath}/${action}`])
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
          .filter((elm) => elm.length !== 0 && !elm.includes(this.#apiPath))
          .join('||');
      })
      .then((dingzActions) => this.setDeviceData(url, dingzActions))
      .then(() => this.debug(`unsubscribeDingzAction() - ${action} unsubscribed`))
      .catch((err) => this.error(`subscribeDingzAction() > ${err}`));
  }

  // Settings-Page

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

};
