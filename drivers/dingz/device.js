"use strict";

const Homey = require("homey");
const { HomeyAPI } = require("athom-api");

const { DINGZ } = require("../device");
const Device = require("../device");

module.exports = class DingzDevice extends Device {
  async onInit(options = {}) {
    super.onInit(options);

    this.api = await HomeyAPI.forCurrentHomey();
    this.deviceApi = this.api.devices;

    this.registerDingzAction("dingzGenAction", `action/generic`);

    this.debug("device has been inited");
  }

  async deviceReady() {
    try {
      super.deviceReady();

      const dingzDevice = await this.getDingzDevice();
      await this.initDingzSensors();
      await this.initMotionDetector(dingzDevice);
    } catch {}
  }

  onDeleted() {
    super.onDeleted();

    this.deregisterDingzAction("dingzGenAction", `action/generic`);
    this.deregisterDingzAction("dingzPirGenAction", `action/pir/generic`);

    clearInterval(this.dingzSensorsInterval);

    // Not working, see: https://github.com/athombv/homey-apps-sdk-issues/issues/123
    // this.getSubDevices().forEach((device) => {
    //   this.debug("onDeleted() - delete mySub-Devices");
    //   this.deviceApi.deleteDevice({ id: device.id }).catch((error) => {
    //     this.error(`deleteSubDevice - '${device.name}' > ${error}`);
    //   });
    // });
  }

  handleDeviceAction(params) {
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
      case DINGZ.SHORT_PRESS:
      case DINGZ.DOUBLE_PRESS:
      case DINGZ.LONG_PRESS:
        this.dingzButtonPressed(params);
        break;
      default:
    }
  }

  async getSubDevices() {
    this.debug("getSubDevices()");
    // (device) => device.data.mac === this.data.mac && device.id !== this.id
    return Object.values(await this.deviceApi.getDevices()).filter(
      (device) => device.data.mac === this.data.mac && device.data.deviceId !== "dingz"
    );
  }

  async getDingzDevice() {
    return this.getDeviceData(`device`)
      .then((data) => {
        this.debug("getDingzDevice()");
        return data[this.data.mac];
      })
      .catch((err) => {
        this.error(`getDingzDevice() > ${err}`);
      });
  }

  async initDingzSensors() {
    this.debug("initDingzSensors()");
    this.getDingzSensors();
    this.dingzSensorsInterval = setInterval(() => {
      this.getDingzSensors();
    }, 1 * 60 * 1000); // set interval to every 1 minutes.
  }

  async getDingzSensors() {
    this.debug("getDingzSensors()");
    return this.getDeviceData(`sensors`)
      .then((data) => {
        this.setCapabilityValue("measure_luminance", data.brightness);
        this.setCapabilityValue("measure_temperature", Math.round(data.room_temperature * 10) / 10);
        this.setLightState(data.light_state);
        data.power_outputs.forEach((elm, output) => Homey.emit("measurePowerChanged", { output, value: elm.value }));
      })
      .catch((err) => this.error(`getDingzSensors() - ${err}`));
  }

  async setLightState(state) {
    if (state !== this.getCapabilityValue("light_state")) {
      this.debug(`setLightState() > ${state}`);
      this.setCapabilityValue("light_state", state)
        .then(this.driver.lightStateTrigger(this, {}, { lightState: state }))
        .catch((err) => this.error(`setLightState() - ${err}`));
    }
  }

  async initMotionDetector(dingzDevice) {
    this.debug("initMotionDetector()");
    if (dingzDevice.has_pir) {
      if (!this.hasCapability("alarm_motion")) {
        this.addCapability("alarm_motion")
          .then(this.debug("initMotionDetector() - alarm_motion added"))
          .catch((err) => this.error(`initMotionDetector() - ${err}`));
      }
      this.setDeviceData("action/pir/generic/feedback/enable")
        .then(this.debug("initMotionDetector() - enable PIR generic feedback"))
        .catch((err) => this.error(`initMotionDetector() - enable > ${err}`));
    } else {
      if (this.hasCapability("alarm_motion")) {
        this.removeCapability("alarm_motion")
          .then(this.debug("initMotionDetector() - alarm_motion removed"))
          .catch((err) => this.error(`initMotionDetector() - ${err}`));
      }
      this.setDeviceData("action/pir/generic/feedback/disable")
        .then(this.debug("initMotionDetector() - disable PIR generic feedback"))
        .catch((err) => this.error(`initMotionDetector() - disable > ${err}`));
    }
  }

  async setMotionDetector(motion) {
    this.debug(`setMotionDetector() > ${motion}`);
    this.setCapabilityValue("alarm_motion", motion);
  }

  dingzButtonPressed(params) {
    this.debug(`dingzButtonPressed() > ${JSON.stringify(params)}`);
    this.driver.dingzButtonPressedTrigger(this, {}, params);
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

  async updateSettingLabels() {
    super.updateSettingLabels();

    const labelSubDevices = (await this.getSubDevices())
      .map((device) => `${device.name} (${device.zoneName})`)
      .join("\r\n");

    await this.setSettings({ labelSubDevices });
  }

  // Homey Discovery
  onDiscoveryResult(discoveryResult) {
    return discoveryResult.id === this.data.id;
  }

  async onDiscoveryAvailable(discoveryResult) {
    // await this.createSubDevices();
  }

  onDiscoveryAddressChanged(discoveryResult) {
    // Update your connection details here, reconnect when the device is offline
  }

  onDiscoveryLastSeenChanged(discoveryResult) {
    // When the device is offline, try to reconnect here
  }
};
