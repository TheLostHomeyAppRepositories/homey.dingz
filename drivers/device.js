'use strict';

const { HttpAPI } = require('my-homey');

const { MyMqttDevice } = require('my-homey');

const { DINGZ } = require('../lib/dingzAPI');

module.exports = class BaseDevice extends MyMqttDevice {

  #apiPath = '';

  dingzConfig = null;

  static get DINGZ() {
    return DINGZ;
  }

  // v1 to v2 Compatibility
  get dataMac() {
    return this.data.mac.toLowerCase();
  }

  get dataModel() {
    return this.data.model || this.getStoreValue('dataModel');
  }

  get dataDip() {
    return this.data.dip || this.getStoreValue('dataDip');
  }

  get dataDevice() {
    return this.data.device || this.data.relativeIdx;
  }

  get dataType() {
    return this.data.type || this.data.deviceId;
  }

  async onInit(options = {}) {
    super.onInit(options);

    const httpAPI = new HttpAPI(this, `http://${this.getStoreValue('address')}/api/v1/`);
    await httpAPI.get('services_config')
      .then(async (config) => {
        const uri = this.getMqttBrokerUri();
        if (!config['mqtt'].enable || config['mqtt'].uri !== uri) {
          await httpAPI.post('services_config', { mqtt: { uri, enable: true } });
        }
      })
      .then(() => this.logDebug('onInit() > dingzSwitch mqtt-service initialized'))
      .catch((err) => {
        this.setUnavailable(err.message);
        this.logError(`onInit() > dingzSwitch error: ${err}`);
      });

    // NOTE: Convert from v1 to v2 format
    let v2id = this.data.id.toLowerCase();
    v2id = v2id.replace(':dimmer:', ':output:');
    v2id = v2id.replace(':blind:', ':motor:');

    await this.registerTopicListener(`${this.homey.app.rootTopic}/config/${v2id.replaceAll(':', '/')}`, (topic, data) => {
      this.logDebug(`onTopicConfig() > ${topic} data: ${JSON.stringify(data)}`);
      this.dingzConfig = data;
      this.initDingzConfig();
    });
  }

  initDevice() {
    return super.initDevice();
  }

  async initDingzConfig() {
    this.logDebug('initDingzConfig()');

    // v1 to v2 Compatibility (Only ones)
    if (!this.data.model || this.getStoreValue('dataModel')) {
      await this.setStoreValue('dataModel', this.dingzConfig.model);
    }

    if (!this.data.dip || this.getStoreValue('dataDip')) {
      await this.setStoreValue('dataDip', this.dingzConfig.dip);
    }

    this.verifyDevice();
  }

  verifyDevice() {
    this.logDebug('verifyDevice()');

    if (!this.dingzConfig.firmware.startsWith('2.1')) {
      throw new Error('dingz firmware v2.1.x required');
    }

    if (this.dataDip !== this.dingzConfig.dip) {
      throw new Error(`dingz dip switch has changed to ${this.dingzConfig.dip}. Remove all devices of the dingz switch and add them again.`);
    }

    if (this.dataType !== this.dingzConfig.type) {
      throw new Error(`dingz output/motor type has changed to ${this.dingzConfig.type}. Remove the device and add it again.`);
    }
  }

  // MqttClient

  getMqttBrokerUri() {
    return this.homey.app.getMqttBrokerUri();
  }

  registerTopicListener(topic, callback) {
    const myTopic = topic.startsWith('/') ? `dingz/${this.dataMac}/${this.dataModel}${topic}` : topic;
    super.registerTopicListener(myTopic, callback);
  }

  sendCommand(topic, data) {
    const myTopic = topic.startsWith('/') ? `dingz/${this.dataMac}/${this.dataModel}/command${topic}` : topic;
    return super.sendCommand(myTopic, data);
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

  // async setDingzSwitchSettings() {
  //   this.logDebug('setDingzSwitchSettings()');
  //   return this.getDeviceData('device')
  //     .then((data) => this.setSettings({
  //       mac: Object.keys(data)[0],
  //       dip: Object.values(data)[0].dip_config.toString(),
  //       firmware: Object.values(data)[0].fw_version.toString(),
  //       frontModel: Object.values(data)[0].front_hw_model.toUpperCase(),
  //       baseModel: Object.values(data)[0].puck_hw_model.toUpperCase(),
  //     }))
  //     .catch((err) => this.logError(`setDingzSwitchSettings() > ${err}`));
  // }

  // NOTE: simplelog-api on/off

  logDebug(msg) {
    if (process.env.DEBUG === '1') {
      super.logDebug(msg);
    }
  }

};
