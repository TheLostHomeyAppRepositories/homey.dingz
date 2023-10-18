'use strict';

const { MyApp } = require('my-homey');

const { DINGZ } = require('./lib/dingzAPI');
const DingzNet = require('./lib/dingzNet');

module.exports = class DingzApp extends MyApp {

  #onceDay = null;

  static get DINGZ() {
    return DINGZ;
  }

  async onInit() {
    super.onInit();

    this.homey.settings.unset('mqtt'); // NOTE: Only for test
    if (!this.homey.settings.get('mqtt')) {
      await this.homey.settings.set('mqtt', JSON.stringify({
        broker: 'localhost',
        port: '1883',
        user: 'mqttUser',
        password: 'mqttPasswd',
      }));
    }
    this.rootTopic = 'dingz/dingzNet';

    this.dingzNet = new DingzNet(this);
    await this.dingzNet.initDingzNet(await this.getMqttBrokerUri());
  }

  async getMqttBrokerUri() {
    const mqtt = JSON.parse(this.homey.settings.get('mqtt'));
    const localAddress = (await this.homey.cloud.getLocalAddress()).split(':')[0];

    return `mqtt://${mqtt.user}:${mqtt.password}@${mqtt.broker === 'localhost' || mqtt.broker === '127.0.0.1' ? localAddress : mqtt.broker}:${mqtt.port}`;
  }

  notifyDeviceWarning() {
    // Only once a day
    if (this.#onceDay !== new Date().toLocaleDateString()) {
      this.#onceDay = new Date().toLocaleDateString();
      this.notifyError('Your dingz devices are no longer working properly. Please read the "[App][Pro] dingz" documentation');
    }
  }

  // NOTE: simplelog-api on/off

  logDebug(msg) {
    if (process.env.DEBUG === '1') {
      super.logDebug(msg);
    }
  }

};
