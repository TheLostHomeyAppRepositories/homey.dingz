'use strict';

const { HttpAPI } = require('my-homey');

const BaseDevice = require('../device');

const { DINGZ } = require('../../lib/dingzAPI');

module.exports = class DingzDevice extends BaseDevice {

  #buttons = {};

  async onInit(options = {}) {
    super.onInit(options);

    // NOTE: Remove v1 actionUrl >> del on next version
    const httpAPI = new HttpAPI(this.homey, `http://${this.getStoreValue('address')}/api/v1/`);
    Promise.resolve()
      .then(async (data) => {
        await httpAPI.post('action/pir1/fall/', '');
        await httpAPI.post('action/pir1/day/', '');
        await httpAPI.post('action/pir1/night/', '');
        await httpAPI.post('action/pir1/twilight/', '');
      })
      .catch(async (error) => {
        this.logError(`onInit() > reset actionUrl ${error}`);
      });

    this.registerDeviceListener('/sensor/light', this.onTopicLight.bind(this));
    this.registerDeviceListener('/sensor/temperature', this.onTopicTemperature.bind(this));
    this.registerDeviceListener('/event/pir/0', this.onTopicPir.bind(this));
    this.registerDeviceListener('/event/button/0', this.onTopicButton.bind(this));
    this.registerDeviceListener('/event/button/1', this.onTopicButton.bind(this));
    this.registerDeviceListener('/event/button/2', this.onTopicButton.bind(this));
    this.registerDeviceListener('/event/button/3', this.onTopicButton.bind(this));

    this.registerDeviceListener(`${this.dingzNet.rootTopic}/config/${this.dataMac}/button/0`, this.onTopicButtonConfig.bind(this));
    this.registerDeviceListener(`${this.dingzNet.rootTopic}/config/${this.dataMac}/button/1`, this.onTopicButtonConfig.bind(this));
    this.registerDeviceListener(`${this.dingzNet.rootTopic}/config/${this.dataMac}/button/2`, this.onTopicButtonConfig.bind(this));
    this.registerDeviceListener(`${this.dingzNet.rootTopic}/config/${this.dataMac}/button/3`, this.onTopicButtonConfig.bind(this));
  }

  async initDingzConfig() {
    super.initDingzConfig();

    if (this.dataModel === 'dz1f-4b' && this.hasCapability('alarm_motion')) {
      await this.removeCapability('alarm_motion')
        .then(() => this.logDebug('initDingzConfig() - alarm_motion capability removed'))
        .catch((error) => this.logError(`initDingzConfig() - ${error}`));
    }
  }

  onTopicLight(topic, data) {
    this.logDebug(`onTopicLight() > ${topic} data: ${data}`);

    this.setCapabilityValue('measure_luminance', data);
  }

  onTopicTemperature(topic, data) {
    this.logDebug(`onTopicTemperature() > ${topic} data: ${data}`);

    this.setCapabilityValue('measure_temperature', Math.round(data * 10) / 10);
  }

  onTopicPir(topic, data) {
    this.logDebug(`onTopicPir() > ${topic} data: ${data}`);

    this.setCapabilityValue('alarm_motion', data !== 'n');
  }

  onTopicButton(topic, data) {
    this.logDebug(`onTopicButton() > ${topic} data: ${data}`);

    const state = { buttonId: Number(topic.split('/').slice(-1)[0]), action: data };

    if (state.buttonId in this.#buttons) {
      switch (this.#buttons[state.buttonId].mode) {
        case DINGZ.MODE_BUTTON:
          switch (data) {
            case DINGZ.SHORT_PRESS:
            case DINGZ.DOUBLE_PRESS:
            case DINGZ.LONG_PRESS:
              this.driver.triggerDingzButtonPressedFlow(this, {}, state);
              break;
            default:
          }
          break;
        case DINGZ.MODE_REMOTE:
          // TODO: Carousel
          break;
        default:
      }
    } else {
      this.logError(`onTopicButton() - Button doesn't exist > ${topic} data: ${data}`);
    }
  }

  onTopicButtonConfig(topic, data) {
    this.logDebug(`onTopicButtonConfig() > ${topic} data: ${JSON.stringify(data)}`);
    this.#buttons[data.device] = data;
  }

  onDingzButtonAutocomplete() {
    return Object.values(this.#buttons)
      .filter((button) => button.mode === DINGZ.MODE_BUTTON)
      .map((button) => {
        const id = button.device;
        const name = button.name === '' ? `${button.device + 1}` : `${button.device + 1} - (${button.name})`;
        return { id, name };
      });
  }

};
