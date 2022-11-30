'use strict';

const { DINGZ } = require('../../lib/dingzAPI');
const Device = require('../device');

module.exports = class DingzDevice extends Device {

  async onInit(options = {}) {
    super.onInit(options);
  }

  initDingzSwitchEvent() {
    this.debug('initDingzSwitchEvent()');

    this.subscribeDingzAction('dingzSwitchEvent', 'action/generic/generic/');

    this.homey.on(`dingzPirChanged-${this.data.mac}`, (params) => {
      this.debug(`dingzSwitchEvent: dingzPirChanged > ${JSON.stringify(params)}`);
      switch (params.action) {
        case DINGZ.MOTION_START:
          this.setMotionDetector(true);
          break;
        case DINGZ.MOTION_STOP:
          this.setMotionDetector(false);
          break;
        case DINGZ.MOTION_DAY:
        case DINGZ.MOTION_TWILIGHT:
        case DINGZ.MOTION_NIGHT:
          this.setLightState(this.convertMotionMode(params.action));
          break;
        default:
      }
    });

    this.homey.on(`dingzButtonPressed-${this.data.mac}`, (params) => {
      this.debug(`dingzSwitchEvent: dingzButtonPressed > ${JSON.stringify(params)}`);
      switch (params.action) {
        case DINGZ.SHORT_PRESS:
        case DINGZ.DOUBLE_PRESS:
        case DINGZ.LONG_PRESS:
          this.driver.triggerDingzButtonPressedFlow(this, {}, params);
          break;
        default:
      }
    });

    this.homey.on('unload', async () => {
      this.debug('homeyEvent: unload');
      this.unsubscribeDingzAction('dingzSwitchEvent', 'action/generic/generic/');
    });
  }

  async initDevice() {
    super.initDevice()
      .then(this.initMotionDetector())
      .then(this.initDingzSensors());
  }

  async initMotionDetector() {
    this.debug('initMotionDetector()');
    const dingzDevice = await this.getDingzDevice();

    if (dingzDevice.has_pir) {
      if (!this.hasCapability('alarm_motion')) {
        this.addCapability('alarm_motion')
          .then(this.debug('initMotionDetector() - alarm_motion added'))
          .catch((err) => this.error(`initMotionDetector() - ${err}`));
      }
      this.setDeviceData('action/pir/generic/feedback/enable')
        .then(this.debug('initMotionDetector() - enable PIR generic feedback'))
        .catch((err) => this.error(`initMotionDetector() - enable > ${err}`));
    } else {
      if (this.hasCapability('alarm_motion')) {
        this.removeCapability('alarm_motion')
          .then(this.debug('initMotionDetector() - alarm_motion removed'))
          .catch((err) => this.error(`initMotionDetector() - ${err}`));
      }
      this.setDeviceData('action/pir/generic/feedback/disable')
        .then(this.debug('initMotionDetector() - disable PIR generic feedback'))
        .catch((err) => this.error(`initMotionDetector() - disable > ${err}`));
    }
  }

  initDingzSensors() {
    this.debug('initDingzSensors()');
    this.getDeviceValues();
    this.dingzSensorsInterval = setInterval(() => {
      this.getDeviceValues();
    }, 1 * 60 * 1000); // set interval to every 1 minutes.

    this.homey.on('unload', async () => {
      this.debug('initDingzSensors() > homeyEvent: unload');
      clearInterval(this.dingzSensorsInterval);
    });
  }

  // Homey Lifecycle
  onDeleted() {
    super.onDeleted();
    clearInterval(this.dingzSensorsInterval);
  }

  async getDingzDevice() {
    return this.getDeviceData('device')
      .then((data) => {
        this.debug('getDingzDevice()');
        return data[this.data.mac];
      })
      .catch((err) => {
        this.error(`getDingzDevice() > ${err}`);
      });
  }

  async getDeviceValues(url = 'sensors') {
    return super.getDeviceValues(url)
      .then((data) => {
        this.setCapabilityValue('measure_luminance', data.brightness);
        this.setCapabilityValue('measure_temperature', Math.round(data.room_temperature * 10) / 10);
        this.setLightState(data.light_state);
        data.power_outputs.forEach((elm, output) => this.homey.emit('measurePowerChanged', { output, value: elm.value }));
      })
      .catch((err) => this.error(`getDingzSensors() - ${err}`));
  }

  async setMotionDetector(motion) {
    this.debug(`setMotionDetector() > ${motion}`);
    this.setCapabilityValue('alarm_motion', motion);
  }

  async setLightState(state) {
    if (state !== this.getCapabilityValue('light_state')) {
      this.debug(`setLightState() > ${state}`);
      this.setCapabilityValue('light_state', state)
        .then(this.driver.triggerLightStateChangedFlow(this, {}, { lightState: state }))
        .catch((err) => this.error(`setLightState() - ${err}`));
    }
  }

  convertMotionMode(mode) {
    switch (mode) {
      case DINGZ.MOTION_DAY:
        return DINGZ.LIGHT_STATE_DAY;
      case DINGZ.MOTION_TWILIGHT:
        return DINGZ.LIGHT_STATE_TWILIGHT;
      case DINGZ.MOTION_NIGHT:
        return DINGZ.LIGHT_STATE_NIGHT;
      default:
        return `[${mode}]`;
    }
  }

  onDingzButtonAutocomplete() {
    return this.getDeviceData('button_config')
      .then((buttonConf) => {
        return Object.values(buttonConf.buttons)
          .map((button, idx) => {
            const { output } = button;
            const id = (idx + 1).toString();
            const name = button.name === '' ? `${id}` : `${id} - (${button.name})`;
            return { id, name, output };
          })
          .filter((button) => button.output === null || button.output === 0);
      });
  }

};
