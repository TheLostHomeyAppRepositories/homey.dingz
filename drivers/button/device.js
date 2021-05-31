"use strict";

const Homey = require("homey");
const Device = require("../device");
const { DINGZ } = require("../device");

module.exports = class ButtonDevice extends Device {
  async onInit(options = {}) {
    super.onInit(options);

    this.btn = (this.data.absoluteIdx + 1).toString();

    this.registerCapabilityListener("button", this.onCapabilityButton.bind(this));

    this.registerDingzAction("dingzButtonGenAction", `action/btn${this.btn}/generic`);
    Homey.on("dingzButtonGenAction", (params) => {
      this.deviceActionReceived("dingzButtonGenAction", params);
    });

    this.debug("device has been inited");
  }

  onDeleted() {
    super.onDeleted();
    this.deregisterDingzAction("dingzButtonGenAction", `action/btn${this.btn}/generic`);
  }

  isActionForDevice(params) {
    return super.isActionForDevice(params) && params.index === this.btn;
  }

  handleDeviceAction(params) {
    if (params.action <= DINGZ.LONG_PRESS) {
      this.driver.buttonPressedTrigger(this, {}, { action: params.action });
    }
  }

  onCapabilityButton(value = true, opts) {
    this.debug(`onCapabilityButton() > ${JSON.stringify(arguments)}`);
    // Software-Button only supports: "short press"
    this.driver.buttonPressedTrigger(this, {}, { action: DINGZ.SINGLE_PRESS });
    return Promise.resolve();
  }
};
