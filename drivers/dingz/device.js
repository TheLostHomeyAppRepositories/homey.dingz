'use strict';

const BaseDevice = require('../device');

const { DINGZ } = require('../../lib/dingzAPI');

module.exports = class DingzDevice extends BaseDevice {

  #buttons = {};

  onInit(options = {}) {
    super.onInit(options);

    this.registerTopicListener('/sensor/light', this.onTopicLight.bind(this));
    this.registerTopicListener('/sensor/temperature', this.onTopicTemperature.bind(this));
    this.registerTopicListener('/event/pir/0', this.onTopicPir.bind(this));
    this.registerTopicListener('/event/button/0', this.onTopicButton.bind(this));
    this.registerTopicListener('/event/button/1', this.onTopicButton.bind(this));
    this.registerTopicListener('/event/button/2', this.onTopicButton.bind(this));
    this.registerTopicListener('/event/button/3', this.onTopicButton.bind(this));

    this.registerTopicListener(`${this.homey.app.rootTopic}/config/${this.dataMac}/button/0`, this.onTopicButtonConfig.bind(this));
    this.registerTopicListener(`${this.homey.app.rootTopic}/config/${this.dataMac}/button/1`, this.onTopicButtonConfig.bind(this));
    this.registerTopicListener(`${this.homey.app.rootTopic}/config/${this.dataMac}/button/2`, this.onTopicButtonConfig.bind(this));
    this.registerTopicListener(`${this.homey.app.rootTopic}/config/${this.dataMac}/button/3`, this.onTopicButtonConfig.bind(this));
  }

  async initDingzConfig() {
    super.initDingzConfig();

    if (this.dataModel === 'dz1f-4b' && this.hasCapability('alarm_motion')) {
      await this.removeCapability('alarm_motion')
        .then(() => this.logDebug('initDingzConfig() - alarm_motion capability removed'))
        .catch((err) => this.logError(`initDingzConfig() - ${err}`));
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

    switch (data) {
      case DINGZ.SHORT_PRESS:
      case DINGZ.DOUBLE_PRESS:
      case DINGZ.LONG_PRESS:
        // this.driver.triggerDingzButtonPressedFlow(this, {}, data);
        break;
      default:
    }
  }

  onTopicButtonConfig(topic, data) {
    this.logDebug(`onTopicButtonConfig() > ${topic} data: ${JSON.stringify(data)}`);
    this.#buttons[data.device] = data;
  }

  onDingzButtonAutocomplete() {
    return Object.values(this.#buttons)
      .map((button) => {
        const id = (button.device + 1).toString();
        const name = button.name === '' ? `${id}` : `${id} - (${button.name})`;
        // return { id, name, myButton }; TODO: not tested
        return { id, name };
      })
      .filter((button) => button.homeyButton);
  }

};
