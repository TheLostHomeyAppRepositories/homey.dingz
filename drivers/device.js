'use strict';

const { HttpAPI } = require('my-homey');

const { MyMqttDevice } = require('my-homey');

const { DINGZ } = require('../lib/dingzAPI');

module.exports = class BaseDevice extends MyMqttDevice {

  dingzConfig = null;

  static get DINGZ() {
    return DINGZ;
  }

  get dingzNet() {
    return this.homey.app.dingzNet;
  }

  // v1/v2 compatibility layer
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

    // NOTE: Convert from v1 to v2 format
    let v2id = this.data.id.toLowerCase();
    v2id = v2id.replace(':dimmer:', ':output:');
    v2id = v2id.replace(':blind:', ':motor:');

    this.registerTopicListener(`${this.dingzNet.rootTopic}/config/${v2id.replaceAll(':', '/')}`, this.onTopicConfig.bind(this));

    // dingzSwitch set mqtt-broker url
    const httpAPI = new HttpAPI(this, `http://${this.getStoreValue('address')}/api/v1/`);
    await httpAPI.get('services_config')
      .then(async (config) => {
        const uri = this.getMqttBrokerUri();
        if (!config['mqtt'].enable || config['mqtt'].uri !== uri) {
          await httpAPI.post('services_config', { mqtt: { uri, enable: true } });
        }
      })
      .then(() => this.logDebug('onInit() > dingzSwitch mqtt-service initialized'))
      .catch(async (error) => {
        await this.setWarning(error.message, 'error').catch(this.logError);
        await this.setUnavailable(error.message).catch(this.logError);
        this.logError(`onInit() > dingzSwitch ${error}`);
      });

    // NOTE: Remove v1 actionUrl >> del on next version
    await httpAPI.get('action')
      .then(async (data) => {
        if (data.generic.includes('/api/app/org.cflat-inc.dingz')) {
          const urls = data.generic.split('||').filter((elm) => elm.length !== 0 && !elm.includes('/api/app/org.cflat-inc.dingz')).join('||');
          await httpAPI.post('action/generic/', urls);
        }
      })
      .catch(async (error) => {
        this.logError(`onInit() > reset actionUrl ${error}`);
      });
  }

  onTopicConfig(topic, data) {
    this.logDebug(`onTopicConfig() > ${topic} data: ${JSON.stringify(data)}`);

    this.dingzConfig = data;
    this.initDingzConfig();

    this.verifyDevice().catch(async (error) => {
      await this.setWarning(error.message, 'error').catch(this.logError);
      await this.setUnavailable(error.message).catch(this.logError);
      this.logError(`onInit() > verifyDevice ${error}`);
    });
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
  }

  verifyDevice() {
    this.logDebug('verifyDevice()');

    return Promise.resolve(true).then(() => {
      if (!this.dingzConfig.firmware.startsWith('2.1')) {
        throw new Error(`dingz [${this.getName()}] firmware v2.1.x required`);
      }
      if (this.dataDip !== this.dingzConfig.dip) {
        throw new Error(`dingz [${this.getName()}] dip-switch has changed to ${this.dingzConfig.dip}. Remove all devices of the dingz and add them again.`);
      }
      if (this.dataType !== this.dingzConfig.type) {
        throw new Error(`dingz [${this.getName()}] output/motor type has changed to ${this.dingzConfig.type}. Remove the device and add it again.`);
      }
    });
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

  // NOTE: simplelog-api on/off

  logDebug(msg) {
    if (process.env.DEBUG === '1') {
      super.logDebug(msg);
    }
  }

};
