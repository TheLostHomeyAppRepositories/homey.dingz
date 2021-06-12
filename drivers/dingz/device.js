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

    this.registerDingzAction("dingzPirGenAction", `action/pir/generic`);
    Homey.on("dingzPirGenAction", (params) => {
      this.deviceActionReceived("dingzPirGenAction", params);
    });

    this.debug("device has been inited");
  }

  async deviceReady() {
    try {
      super.deviceReady();

      const dingzDevice = await this.getDingzDevice();
      await this.initPowerSensors();
      await this.initTemperatureSensor();
      await this.initLuminanceSensor(dingzDevice);
      await this.initMotionDetector(dingzDevice);
    } catch {}
  }

  onDeleted() {
    super.onDeleted();

    this.deregisterDingzAction("dingzGenAction", `action/generic`);
    this.deregisterDingzAction("dingzPirGenAction", `action/pir/generic`);

    clearInterval(this.powerSensorsInterval);
    clearInterval(this.temparatureSensorInterval);
    clearInterval(this.luminanceSensorInterval);

    // Not working, see: https://github.com/athombv/homey-apps-sdk-issues/issues/123
    // this.getSubDevices().forEach((device) => {
    //   this.debug("onDeleted() - delete mySub-Devices");
    //   this.deviceApi.deleteDevice({ id: device.id }).catch((error) => {
    //     this.error(`deleteSubDevice - '${device.name}' > ${error}`);
    //   });
    // });
  }

  isActionForDevice(params) {
    return super.isActionForDevice(params) && params.index === DINGZ.PIR;
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
        this.setMotionMode(params.action);
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

  async initPowerSensors() {
    this.debug("initPowerSensors()");
    this.getPowerSensors();
    this.powerSensorsInterval = setInterval(() => {
      this.getPowerSensors();
    }, 1 * 60 * 1000); // set interval to every 1 minutes.
  }

  async getPowerSensors() {
    this.debug("getPowerSensors()");
    return this.getDeviceData(`sensors`)
      .then((data) => {
        data.power_outputs.forEach((elm, output) => Homey.emit("measurePowerChanged", { output, value: elm.value }));
      })
      .catch((err) => this.error(`getPowerSensors() - ${err}`));
  }

  async initTemperatureSensor() {
    this.debug("initTemperatureSensor()");
    this.getTemperatureSensor();
    this.temparatureSensorInterval = setInterval(() => {
      this.getTemperatureSensor();
    }, 5 * 60 * 1000); // set interval to every 5 minutes.
  }

  async getTemperatureSensor() {
    this.debug("getTemperatureSensor()");
    return this.getDeviceData(`temp`)
      .then((data) => this.setCapabilityValue("measure_temperature", Math.round(data.temperature * 10) / 10))
      .catch((err) => this.error(`getTemperatureSensor() - ${err}`));
  }

  async initLuminanceSensor(dingzDevice) {
    this.debug("initLuminanceSensor()");
    if (dingzDevice.has_pir) {
      if (!this.hasCapability("measure_luminance")) {
        await this.addCapability("measure_luminance");
        this.debug("initLuminanceSensor() - measure_luminance added");
      }
      this.getLuminanceSensor();
      this.luminanceSensorInterval = setInterval(() => {
        this.getLuminanceSensor();
      }, 10 * 60 * 1000); // set interval to every 10 minutes.
    } else if (this.hasCapability("measure_luminance")) {
      await this.removeCapability("measure_luminance");
      this.debug("initLuminanceSensor() - measure_luminance removed");
    }
  }

  async getLuminanceSensor() {
    this.debug("getLuminanceSensor()");
    return this.getDeviceData(`light`)
      .then((data) => {
        if (data.intensity !== this.getCapabilityValue("measure_luminance")) {
          this.setCapabilityValue("measure_luminance", data.intensity);
        }
      })
      .catch((err) => this.error(`getLuminanceSensor() - ${err}`));
  }

  async initMotionDetector(dingzDevice) {
    return new Promise((resolve, reject) => {
      this.debug("initMotionDetector()");
      if (dingzDevice.has_pir) {
        this.setDeviceData("/action/pir/generic/feedback/enable")
          .then(this.debug("initMotionDetector() - enable PIR generic feedback"))
          .then(() => {
            if (!this.hasCapability("alarm_motion")) {
              this.addCapability("alarm_motion").then(this.debug("initMotionDetector() - alarm_motion added"));
            }
            if (!this.hasCapability("motion_mode")) {
              this.addCapability("motion_mode").then(this.debug("initMotionDetector() - motion_mode added"));
            }
          })
          .then(this.getDeviceData("motion").then((data) => this.setMotionDetector(data.motion)))
          .then(this.driver.motionModeTrigger(this, {}, { motionMode: this.getCapabilityValue("motion_mode") }))
          .catch((err) => reject(err));
      } else {
        this.setDeviceData("/action/pir/generic/feedback/disable")
          .then(this.debug("initMotionDetector() - disable PIR generic feedback"))
          .then(() => {
            if (this.hasCapability("alarm_motion")) {
              this.removeCapability("alarm_motion").then(this.debug("initMotionDetector() - alarm_motion removed"));
            }
            if (this.hasCapability("motion_mode")) {
              this.removeCapability("motion_mode").then(this.debug("initMotionDetector() - motion_mode removed"));
            }
          })
          .catch((err) => reject(err));
      }
      resolve();
    });
  }

  async setMotionDetector(motion) {
    if (!this.hasCapability("alarm_motion")) return;
    this.debug(`setMotionDetector() > ${motion}`);
    await this.setCapabilityValue("alarm_motion", motion);
  }

  async setMotionMode(motionMode) {
    if (motionMode !== this.getCapabilityValue("motion_mode")) {
      this.debug(`setMotionMode() > ${motionMode}`);
      this.setCapabilityValue("motion_mode", motionMode);
      this.driver.motionModeTrigger(this, {}, { motionMode });
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
