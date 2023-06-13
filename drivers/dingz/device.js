'use strict';

const BaseDevice = require('../device');

const { DINGZ } = require('../../lib/dingzAPI');

module.exports = class DingzDevice extends BaseDevice {

  #dingzSensorsInterval;

  onInit(options = {}) {
    super.onInit(options);
  }

  // Homey Lifecycle

  onDeleted() {
    super.onDeleted();
    this.homey.clearInterval(this.#dingzSensorsInterval);
  }

  onUnload() {
    super.onUnload();
    this.homey.clearInterval(this.#dingzSensorsInterval);
  }

  initDevice() {
    return super.initDevice()
      .then(() => this.initMotionDetector())
      .then(() => this.initDingzSensors());
  }

  initDingzSwitchEvent() {
    this.logDebug('initDingzSwitchEvent()');

    this.homey.on(`dingzButtonPressed-${this.data.mac}`, (params) => {
      this.logDebug(`dingzSwitchEvent: dingzButtonPressed > ${JSON.stringify(params)}`);
      switch (params.action) {
        case DINGZ.SHORT_PRESS:
        case DINGZ.DOUBLE_PRESS:
        case DINGZ.LONG_PRESS:
          this.driver.triggerDingzButtonPressedFlow(this, {}, params);
          break;
        default:
      }
    });
    this.subscribeDingzAction('action/generic', 'dingzSwitchEvent');

    this.homey.on(`dingzPirChanged-${this.data.mac}`, (params) => {
      this.logDebug(`dingzSwitchEvent: dingzPirChanged > ${JSON.stringify(params)}`);
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
  }

  initMotionDetector() {
    this.logDebug('initMotionDetector()');

    return this.getDeviceData('device')
      .then((data) => Object.values(data)[0])
      .then((device) => {
        if (device.has_pir) {
          if (!this.hasCapability('alarm_motion')) {
            this.addCapability('alarm_motion')
              .then(() => this.logDebug('initMotionDetector() - alarm_motion added'))
              .catch((err) => this.logError(`initMotionDetector() - ${err}`));
          }
          Promise.resolve()
            .then(() => this.subscribeDingzActionUrl('action/pir1/fall', `dingzSwitchEvent?mac=${this.data.mac}&index=${DINGZ.PIR}&action=${DINGZ.MOTION_STOP}&daytime=fall`))
            .then(() => this.subscribeDingzActionUrl('action/pir1/day', `dingzSwitchEvent?mac=${this.data.mac}&index=${DINGZ.PIR}&action=${DINGZ.MOTION_START}&daytime=day`))
            .then(() => this.subscribeDingzActionUrl('action/pir1/night', `dingzSwitchEvent?mac=${this.data.mac}&index=${DINGZ.PIR}&action=${DINGZ.MOTION_START}&daytime=night`))
            .then(() => this.subscribeDingzActionUrl('action/pir1/twilight', `dingzSwitchEvent?mac=${this.data.mac}&index=${DINGZ.PIR}&action=${DINGZ.MOTION_START}&daytime=twilight`));
        } else {
          // eslint-disable-next-line no-lonely-if
          if (this.hasCapability('alarm_motion')) {
            this.removeCapability('alarm_motion')
              .then(() => this.logDebug('initMotionDetector() - alarm_motion removed'))
              .catch((err) => this.logError(`initMotionDetector() - ${err}`));
          }
        }
      })
      .catch((err) => this.logError(`initMotionDetector() > ${err}`));
  }

  initDingzSensors() {
    this.logDebug('initDingzSensors()');
    this.#dingzSensorsInterval = this.homey.setInterval(() => {
      this.logDebug('initDingzSensors() > refresh sensor');
      this.getDeviceValues();
    }, 1 * 60 * 1000); // set interval to every 1 minutes.
  }

  // Data handling

  getDeviceValues(url = 'sensors') {
    return super.getDeviceValues(url)
      .then((data) => {
        this.setCapabilityValue('measure_luminance', data.brightness);
        this.setCapabilityValue('measure_temperature', Math.round(data.room_temperature * 10) / 10);
        this.setLightState(data.light_state);

        data.power_outputs
          .forEach((elm, output) => this.homey.emit(`measurePowerChanged-${this.data.mac}`, { output, value: elm.value }));
      })
      .catch((err) => this.logError(`getDingzSensors() - ${err}`));
  }

  setMotionDetector(motion) {
    this.logDebug(`setMotionDetector() > ${motion}`);
    this.setCapabilityValue('alarm_motion', motion);
  }

  setLightState(state) {
    if (state !== this.getCapabilityValue('light_state')) {
      this.logDebug(`setLightState() > ${state}`);
      this.setCapabilityValue('light_state', state)
        // .then(() => this.driver.triggerLightStateChangedFlow(this, {}, { lightState: state }))
        .then(() => {
          // >> Temp fix until users have finally reimported the devices
          if (typeof this.driver.triggerLightStateChangedFlow === 'function') {
            this.driver.triggerLightStateChangedFlow(this, {}, { lightState: state });
          } else {
            this.homey.app.notifyDeviceWarning();
          }
        })
        .catch((err) => this.logError(`setLightState() - ${err}`));
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
            const id = (idx + 1).toString();
            const name = button.name === '' ? `${id}` : `${id} - (${button.name})`;
            const myButton = !(button.mode.local || button.mode.remote || button.button.therm_ctrl); // TODO: ?? Thermostat ??
            return { id, name, myButton };
          })
          .filter((button) => button.myButton);
      });
  }

};
