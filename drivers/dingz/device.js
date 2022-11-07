'use strict';

const { DINGZ } = require('../device');
const Device = require('../device');

const APP_PATH = 'api/app/org.cflat-inc.dingzX';
module.exports = class DingzDevice extends Device {

  async onInit(options = {}) {
    super.onInit(options);

    this.subscribeDingzAction('dingzGenAction', 'action/generic/generic/');

    this.homey.on('dingzGenAction', (params) => {
      if (this.isActionForDevice(params)) {
        this.debug(`dingzActionEvent: dingzGenAction > ${JSON.stringify(params)}`);
        switch (params.index) {
          case DINGZ.PIR:
            this.homey.emit('dingzPirGenAction', params);
            break;
          case DINGZ.BTN1:
          case DINGZ.BTN2:
          case DINGZ.BTN3:
          case DINGZ.BTN4:
            this.homey.emit('dingzButtonGenAction', params);
            break;
          default:
        }
      }
    });

    this.homey.on('dingzButtonGenAction', (params) => {
      if (this.isActionForDevice(params)) {
        this.debug(`dingzActionEvent: dingzButtonGenAction > ${JSON.stringify(params)}`);
        switch (params.action) {
          case DINGZ.SHORT_PRESS:
          case DINGZ.DOUBLE_PRESS:
          case DINGZ.LONG_PRESS:
            this.driver.triggerDingzButtonPressedFlow(this, {}, params);
            break;
          default:
        }
      }
    });

    this.homey.on('dingzPirGenAction', (params) => {
      if (this.isActionForDevice(params)) {
        this.debug(`dingzActionEvent: dingzPirGenAction > ${JSON.stringify(params)}`);
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
      }
    });

    this.homey.on('unload', async () => {
      this.debug('homeyEvent: unload');
      clearInterval(this.dingzSensorsInterval);
      await this.unsubscribeDingzAction('dingzGenAction', 'action/generic/generic/');
    });
  }

  async deviceReady() {
    super.deviceReady()
      .then(() => this.initMotionDetector())
      .then(() => this.initDingzSensors());
  }

  // Homey Lifecycle
  onDeleted() {
    super.onDeleted();
    clearInterval(this.dingzSensorsInterval);
    this.unsubscribeDingzAction('dingzGenAction', 'action/generic/generic/');
  }

  // Homey Discovery
  onDiscoveryResult(discoveryResult) {
    return discoveryResult.id === this.data.id;
  }

  onDiscoveryAvailable(discoveryResult) {
    this.log('onDiscoveryAvailable');
  }

  onDiscoveryAddressChanged(discoveryResult) {
    this.log(`onDiscoveryAddressChanged to: ${discoveryResult.address}`);

    this.setStoreValue('address', discoveryResult.address)
      .then(this.updateSettingLabels())
      .then(this.homey.emit('addressChanged', discoveryResult))
      .catch((err) => this.error(`onDiscoveryAddressChanged() > ${err}`));
  }

  onDiscoveryLastSeenChanged(discoveryResult) {
    this.debug('onDiscoveryLastSeenChanged');
    this.setAvailable()
      .catch((err) => this.error(`setAvailable() > ${err}`));
  }

  // Dingz action
  async subscribeDingzAction(action, url) {
    this.debug(`subscribeDingzAction() - ${action} > ${url}`);

    this.getDeviceData(url)
      .then(async (dingzActions) => {
        return dingzActions.url
          .split('||')
          .filter((elm) => elm.length !== 0 && !elm.includes(APP_PATH))
          .concat([`get://${this.homey.app.homeyAddress}/${APP_PATH}/${action}`])
          .join('||');
      })
      .then((dingzActions) => this.setDeviceData(url, dingzActions))
      .then(() => this.debug(`subscribeDingzAction() - ${action} subscribed`))
      .catch((err) => {
        this.error(`subscribeDingzAction() > ${err}`);
        this.setUnavailable(err).catch((err) => {
          this.error(`setUnavailable() > ${err}`);
        });
      });
  }

  async unsubscribeDingzAction(action, url) {
    this.debug(`unsubscribeDingzAction() - ${action} > ${url}`);

    this.getDeviceData(url)
      .then((dingzActions) => {
        return dingzActions.url
          .split('||')
          .filter((elm) => elm.length !== 0 && !elm.includes(APP_PATH))
          .join('||');
      })
      .then((dingzActions) => this.setDeviceData(url, dingzActions))
      .then(() => this.debug(`unsubscribeDingzAction() - ${action} unsubscribed`))
      .catch((err) => {
        this.error(`unsubscribeDingzAction() > ${err}`);
        this.setUnavailable(err).catch((err) => {
          this.error(`setUnavailable() > ${err}`);
        });
      });
  }

  async getDeviceValues(url = 'led/get') {
    // return super.getDeviceValues(url) // > FW: 1.4x
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

  async initMotionDetector() {
    this.debug('initMotionDetector()');
    const dingzDevice = this.getDingzDevice();

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

  async initDingzSensors() {
    this.debug('initDingzSensors()');
    this.getDingzSensors();
    this.dingzSensorsInterval = setInterval(() => {
      this.getDingzSensors();
    }, 1 * 60 * 1000); // set interval to every 1 minutes.
  }

  async getDingzSensors() {
    this.debug('getDingzSensors()');
    return this.getDeviceData('sensors')
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
      .then((buttonConf) => buttonConf.buttons.map((button, idx) => {
        const id = (idx + 1).toString();
        const name = button.name === '' ? `${id}` : `${button.name} (${id})`;
        return { id, name };
      }));
  }

  async updateSettingLabels() {
    super.updateSettingLabels();

    const labelSubDevices = Object.values(await this.homey.app.api.devices.getDevices()).filter(
      // (device) => device.data.mac === this.data.mac && device.id !== this.id
      (device) => device.data.mac === this.data.mac && device.data.deviceId !== 'dingz',
    )
      .map((device) => `${device.name} (${device.zoneName})`)
      .join('\r\n');

    await this.setSettings({ labelSubDevices });
  }

};
