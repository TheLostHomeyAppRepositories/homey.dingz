"use strict";

const Homey = require("homey");
const Http = require("../lib/http");

const DINGZ = {
  // default
  RAMP_DEFAULT: "1",
  // params > index
  BTN1: "1",
  BTN2: "2",
  BTN3: "3",
  BTN4: "4",
  PIR: "5",
  INPUT: "6",
  // params > action
  SINGLE_PRESS: "1",
  DOUBLE_PRESS: "2",
  LONG_PRESS: "3",
  PRESS: "8",
  RELEASE: "9",
  MOTION_START: "8",
  MOTION_STOP: "9",
  MOTION_NIGHT: "14",
  MOTION_TWILIGHT: "15",
  MOTION_DAY: "16",
};

module.exports = class Device extends Homey.Device {
  static get DINGZ() {
    return DINGZ;
  }

  async onInit(options = {}) {
    this.debug("device init ...");
    super.onInit();

    const baseUrl = options.baseUrl ? options.baseUrl : `http://${this.getSetting("ipAddress")}/api/v1/`;
    this.http = new Http(baseUrl);

    this.driver = this.getDriver();
    this.data = this.getData();

    Homey.on("dingzDevice.changed", (params) => {
      this.updateSettingLabels();
    });

    this.setUnavailable(Homey.__("connecting")).catch((err) => {
      this.error(`setUnavailable() > ${err}`);
    });

    this.ready(() => {
      this.log("device ready ...");
      this.deviceReady();
    });
  }

  deviceReady() {
    this.updateSettingLabels();

    this.setAvailable().catch((err) => {
      this.error(`setAvailable() > ${err}`);
    });
  }

  onAdded() {
    super.onAdded();
    Homey.emit("dingzDevice.changed", this);
    this.log(`device ${this.getName()} added`);
  }

  onDeleted() {
    super.onDeleted();
    Homey.emit("dingzDevice.changed", this);
    this.log(`device ${this.getName()} deleted`);
  }

  onRenamed(name) {
    Homey.emit("dingzDevice.changed", this);
  }

  async registerDingzAction(action, url) {
    this.debug(`registerDingzAction() - ${action} > ${url}`);

    Homey.ManagerCloud.getLocalAddress()
      .then((localAddress) => {
        this.setDeviceData(url, `get://${localAddress.split(":")[0]}/api/app/org.cflat-inc.dingz/${action}`)
          .then(() => this.debug(`registerDingzAction() ${action} registered`))
          .catch((err) => this.error(`registerDingzAction() > ${err}`));
      })
      .catch((err) => {
        this.error(`registerDingzAction() getLocalAddress > ${err}`);
        this.setUnavailable(err).catch((err) => {
          this.error(`setUnavailable() > ${err}`);
        });
      });
  }

  async deregisterDingzAction(action, url) {
    this.debug(`deregisterDingzAction() - ${action} > ${url}`);

    Homey.ManagerCloud.getLocalAddress()
      .then((localAddress) => {
        this.setDeviceData(url, "")
          .then(() => this.debug(`deregisterDingzAction() ${action} registered`))
          .catch((err) => this.error(`deregisterDingzAction() > ${err}`));
      })
      .catch((err) => {
        this.error(`deregisterDingzAction() getLocalAddress > ${err}`);
        this.setUnavailable(err).catch((err) => {
          this.error(`setUnavailable() > ${err}`);
        });
      });
  }

  async deviceActionReceived(action, params) {
    if (this.isActionForDevice(params)) {
      this.debug(`deviceActionReceived() - ${action} > ${JSON.stringify(params)}`);
      this.handleDeviceAction(params);
    }
  }

  isActionForDevice(params) {
    return this.data.mac === params.mac;
  }

  handleDeviceAction(params) {
    // nop;
  }

  setCapabilityValue(capabilityId, value) {
    const currentValue = this.getCapabilityValue(capabilityId);
    if (currentValue === value) return Promise.resolve(currentValue);

    return super
      .setCapabilityValue(capabilityId, value)
      .then(() => {
        this.debug(`setCapabilityValue() '${capabilityId}' - ${currentValue} > ${value}`);
        return value;
      })
      .catch((err) => {
        return this.error(`setCapabilityValue() '${capabilityId}' > ${err}`);
      });
  }

  getDeviceValues(url = "**unknown**") {
    this.debug(`getDeviceValues() - '${url}'`);
    return this.getDeviceData(url);
  }

  getDeviceData(url) {
    return this.http.get(url).then(
      (data) => {
        this.debug(`getDeviceData() - '${url}' > ${JSON.stringify(data)}`);
        this.setAvailable().catch((err) => {
          this.error(`setAvailable() > ${err}`);
        });
        return data;
      },
      (err) => {
        this.error(`getDeviceData() - '${url}' > ${err}`);
        this.setUnavailable(Homey.__("device.error", { code: err.response.status })).catch((err) => {
          this.error(`setUnavailable() > ${err}`);
        });
        return Error("get device data failed");
      }
    );
  }

  setDeviceData(url, value) {
    return this.http.post(url, value).then(
      (data) => {
        this.debug(`setDeviceData() - '${url}' > ${JSON.stringify(value) || ""}`);
        this.setAvailable().catch((err) => {
          this.error(`setAvailable() > ${err}`);
        });
        return data;
      },
      (err) => {
        this.error(`setDeviceData() - '${url}' ${JSON.stringify(value)} > ${err}`);
        this.setUnavailable(Homey.__("device.error", { code: err.response.status })).catch((err) => {
          this.error(`setUnavailable() > ${err}`);
        });
        return Error("set device data failed");
      }
    );
  }

  async updateSettingLabels() {
    this.debug("updateSettingLabels()");
    const labelName = this.getName();
    const labelDeviceId = this.data.deviceId.replace(/^./, (str) => str.toUpperCase());
    await this.setSettings({ labelName, labelDeviceId });
  }

  notify(msg) {
    // new Homey.Notification({ excerpt: `**${this.getName()}** ${msg}` }).register();
    this.log(`Notify: ${msg}`);
  }

  // Homey-App Loggers
  log(msg) {
    Homey.app.log(`${this._logLinePrefix()} ${msg}`);
  }

  error(msg) {
    Homey.app.error(`${this._logLinePrefix()} ${msg}`);
  }

  debug(msg) {
    Homey.app.debug(`${this._logLinePrefix()} ${msg}`);
  }

  _logLinePrefix() {
    return `${this.constructor.name}::${this.getName()} >`;
  }
};
