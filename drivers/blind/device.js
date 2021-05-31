"use strict";

const Homey = require("homey");
const ShadeDevice = require("../shade/device");

module.exports = class BlindDevice extends ShadeDevice {
  onInit(options = {}) {
    super.onInit(options);

    // Register capability change events
    this.registerCapabilityListener("windowcoverings_tilt_set", this.onCapabilityWindowCoveringsTiltSet.bind(this));

    this.debug("device has been inited");
  }

  async onCapabilityWindowCoveringsTiltSet(value, opts) {
    const current = this.getCapabilityValue("windowcoverings_tilt_set");
    if (current === value) return Promise.resolve();

    this.debug(`onCapabilityWindowCoveringsTiltSet() - ${current} > ${value}`);
    const deviceData = await this.getDeviceData(`shade/${this.data.relativeIdx}`);
    const { blind } = deviceData.target;
    const lamella = Math.round(100 - value * 100);

    return this.setDeviceData(`shade/${this.data.relativeIdx}?blind=${blind}&lamella=${lamella}`)
      .then(await this.waitForPosition())
      .then(() => {
        const current = this.getCapabilityValue("windowcoverings_tilt_set");
        this.notify(Homey.__("device.windowCoveringsTiltSet", { value: current * 100 }));
      })
      .catch((err) => this.error(`onCapabilityWindowCoveringsTiltSet() > ${err}`));
  }

  async getDeviceValues(url) {
    return super.getDeviceValues(url).then((data) => {
      this.setCapabilityValue("windowcoverings_tilt_set", (100 - data.target.lamella) / 100);
      return data;
    });
  }
};
