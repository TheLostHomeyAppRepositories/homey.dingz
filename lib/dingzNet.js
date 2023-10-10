'use strict';

const { MySimpleClass, MqttClient } = require('my-homey');

module.exports = class DingzNet extends MySimpleClass {

  #mqttClient;

  constructor(owner) {
    super(owner);

    // this.#mqttClient = new MqttClient(this, this.homey.app.rootTopic);
    this.#mqttClient = MqttClient.getInstance(this, this.homey.app.rootTopic);
  }

  async initDingzNet(uri) {
    const myUrl = new URL(uri);
    const delay = (ms) => new Promise((resolve) => this.homey.setTimeout(resolve, ms));

    this.logDebug(`Initialize dingzNet > uri: ${uri}`);

    await this.#mqttClient
      .connect(uri)
      .then((client) => {
        client
          .on('message', this.onMessage.bind(this))
          .on('connect', (connack) => {
            this.logDebug(`initDingzNet() > connect > ${JSON.stringify(connack)}`);
            this.#mqttClient.subscribe('dingz/+/announce');
          });
      })
      .then(() => delay(1000))
      .then(() => this.logNotice(`dingzNet started - MQTT Broker: ${myUrl.host}`))
      .catch((err) => {
        this.logError(`initDingzNet() ${err}`);
        throw new Error(`Initialize dingzNet ${err.message}`);
      });
  }

  async onMessage(topic, message) {
    const msg = message.toString();

    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      data = msg;
    }

    if (topic.includes('/announce')) {
      this.logDebug(`onMessage() > topic: ${topic} msg: ${msg}`);
      await this.homey.app.getDingzSwitchConfig(data.ip).then((config) => this.#publishConfig(config));
    }
  }

  #publishConfig(config) {
    this.logDebug(`#publishConfig() > config: ${config.name}`);

    [].concat(Object.values(config.dingz), Object.values(config.outputs), Object.values(config.motors), Object.values(config.buttons))
      .forEach((element) => {
        this.#mqttClient.publish(`${this.homey.app.rootTopic}/config/${element.id.replaceAll(':', '/')}`, JSON.stringify(element), { retain: true });
      });
  }

};
