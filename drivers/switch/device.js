"use strict";

const Homey = require("homey");

const { DINGZ } = require("../device");
const Device = require("../device");

module.exports = class SwitchDevice extends Device {
  onInit(options = {}) {
    super.onInit(options);

    this.registerCapabilityListener("onoff", this.onCapabilityOnOff.bind(this));

    Homey.on("measurePowerChanged", (params) => {
      if (params.output === this.data.absoluteIdx) {
        // this.debug(`Homey-Event: 'measurePowerChanged' received > value: ${params.value}`);
        this.setCapabilityValue("measure_power", Math.round(params.value * 10) / 10);
      }
    });

    this.debug("device has been inited");
  }

  async deviceReady() {
    try {
      await super.deviceReady();
      await this.getDeviceValues();
    } catch {}
  }

  async onCapabilityOnOff(value, opts) {
    const current = this.getCapabilityValue("onoff");
    if (current === value) return Promise.resolve();

    const action = value ? "on" : "off";
    const ramp = (this.data.deviceId === "switch" ? 0 : DINGZ.RAMP_DEFAULT) * 10;

    this.debug(`onCapabilityOnOff() - ${current} > ${value}`);

    return this.setDeviceData(`dimmer/${this.data.relativeIdx}/${action}/?ramp=${ramp}`)
      .then(await this.getDeviceValues())
      .then(() => {
        const val = this.getCapabilityValue("onoff") ? "on" : "off";
        this.notify(Homey.__("device.stateSet", { value: val }));
      })
      .catch((err) => this.error(`onCapabilityOnOff() > ${err}`));
  }

  async getDeviceValues(url = `dimmer/${this.data.relativeIdx}`) {
    return super
      .getDeviceValues(url)
      .then(async (data) => {
        await this.setCapabilityValue("onoff", data.on);
        return data;
      })
      .catch((err) => {
        this.error(`getDeviceValues() > ${err}`);
        this.showWarning(err.message);
      });
  }
};
