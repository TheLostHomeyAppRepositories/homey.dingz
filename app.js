'use strict';

// eslint-disable-next-line import/newline-after-import
const EventEmitter = require('events');
EventEmitter.defaultMaxListeners = 100;

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

    // this.homey.settings.unset('mqtt'); // NOTE: Only for test
    if (!this.homey.settings.get('mqtt')) {
      await this.homey.settings.set('mqtt', JSON.stringify({
        broker: 'localhost',
        port: '1883',
        user: 'dingzNet',
        password: 'dingzNet',
      }));
    }

    this.dingzNet = new DingzNet(this.homey);
    await this.dingzNet
      .initDingzNet(await this.getMqttBrokerUri());

    this.logInfo('App has been initialized');
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

};
