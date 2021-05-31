"use strict";

const Homey = require("homey");
const Http = require("../../lib/http");

const { DINGZ } = require("../device");

const Driver = require("../driver");
const DingzDevice = require("./device");
const LedDevice = require("../led/device");
const ButtonDevice = require("../button/device");
const SwitchDevice = require("../switch/device");
const LightDevice = require("../light/device");
const ShadeDevice = require("../shade/device");
const BlindDevice = require("../blind/device");

module.exports = class DingzDriver extends Driver {
  onInit(options = {}) {
    super.onInit(options);

    this.http = new Http();

    // Create flow-cards
    this._buttonPressedTrigger = new Homey.FlowCardTriggerDevice("button_pressed")
      .register()
      .registerRunListener((args, state) => args.action === state.action);

    this._motionModeTrigger = new Homey.FlowCardTriggerDevice("motionMode_changed")
      .register()
      .registerRunListener((args, state) => args.motionMode === state.motionMode);

    this._motionModeCondition = new Homey.FlowCardCondition("is_motionMode")
      .register()
      .registerRunListener((args, state) => args.device.getCapabilityValue("motion_mode") === args.motionMode);

    this._rampAction = new Homey.FlowCardAction("ramp.dim")
      .register()
      .registerRunListener((args, state) => args.device.onCapabilityDim(args, {}));

    this._windowcoveringsTiltSetAction = new Homey.FlowCardAction("windowcoverings_tilt_set")
      .register()
      .registerRunListener((args, state) => args.device.onCapabilityWindowCoveringsTiltSet(args.value, {}));

    this.debug("driver has been inited");
  }

  onMapDeviceClass(device) {
    switch (device.getData().deviceId) {
      case "dingz":
        // this.debug(`onMapDeviceClass - DingzDevice`);
        return DingzDevice;
      case "led":
        // this.debug(`onMapDeviceClass - LedDevice`);
        return LedDevice;
      case "button":
        // this.debug(`onMapDeviceClass - ButtonDevice`);
        return ButtonDevice;
      case "switch":
        // this.debug(`onMapDeviceClass - SwitchDevice`);
        return SwitchDevice;
      case "light":
        // this.debug(`onMapDeviceClass - LightDevice`);
        return LightDevice;
      case "shade":
        // this.debug(`onMapDeviceClass - ShadeDevice`);
        return ShadeDevice;
      case "blind":
        // this.debug(`onMapDeviceClass - BlindDevice`);
        return BlindDevice;
      default:
        this.error(`onMapDeviceClass - unknown deviceId: ${device.getData().deviceId}`);
        return Error(`Unknown Device-id ${device.getData().deviceId}`);
    }
  }

  onPair(socket) {
    const discoveryStrategy = this.getDiscoveryStrategy();
    const discoveryResults = discoveryStrategy.getDiscoveryResults();

    const dingzConfig = {};

    socket.on("list_devices", (data, callback) => {
      const devices = Object.values(discoveryResults).map((discoveryResult) => {
        const roomName = !discoveryResult.txt.room ? "" : `${discoveryResult.txt.room} -`;
        const dingzName = discoveryResult.txt.name || discoveryResult.name;
        return {
          name: `${roomName} ${dingzName}`,

          data: {
            id: discoveryResult.id,
            mac: discoveryResult.txt.mac,
            ipAddress: discoveryResult.address,
            roomName,
            dingzName,
          },
        };
      });
      callback(null, devices);
    });

    socket.on("list_devices_selection", (data, callback) => {
      this.debug(`onPair() - list_devices_selection > data: ${JSON.stringify(data[0])}`);
      Object.assign(dingzConfig, data[0]);
      callback();
    });

    socket.on("getDingzConfig", (data, callback) => {
      callback(null, dingzConfig);
    });

    socket.on("initDingzConfig", async (data, callback) => {
      try {
        const { ipAddress } = dingzConfig.data;

        const device = await this.http.get(`http://${ipAddress}/api/v1/device`);
        const dip = Object.values(device)[0]["dip_config"];

        const system = await this.http.get(`http://${ipAddress}/api/v1/system_config`);
        const roomName = system.room_name ? system.room_name : dingzConfig.data.roomName;
        const dingzName = system.dingz_name ? system.dingz_name : dingzConfig.data.dingzName;

        // Dimmer-Devices
        let { dimmers } = await this.http.get(`http://${ipAddress}/api/v1/dimmer_config`);
        dimmers = dimmers.map((elm, idx) => {
          return {
            id: `dimmer:${idx}`,
            absoluteIdx: idx,
            deviceId: this.getDimmerDeviceId(elm.output),
            name: `${roomName} ${elm.name.replace(/^\w/, (c) => c.toUpperCase())}`,
          };
        });

        // Blind-Devices
        let { blinds } = await this.http.get(`http://${ipAddress}/api/v1/blind_config`);
        blinds = blinds.map((elm, idx) => {
          return {
            id: `blind:${idx}`,
            absoluteIdx: idx,
            deviceId: this.getBlindDeviceId(elm.type),
            name: `${roomName} ${elm.name.replace(/^\w/, (c) => c.toUpperCase())}`,
          };
        });

        dingzConfig.data.roomName = roomName;
        dingzConfig.data.dingzName = dingzName;
        dingzConfig["dingzDevice"] = [{ id: "dingz", deviceId: "dingz", name: `${roomName} ${dingzName}` }];
        dingzConfig["intDevices"] = [{ id: "led", deviceId: "led", name: `${roomName} ${dingzName} led` }];
        dingzConfig["btnDevices"] = await this.defineButtonDevices(dip, dimmers, blinds);

        this.debug(`onPair() - initDeviceConfig > ${JSON.stringify(dingzConfig)}`);
        callback(null, dingzConfig);
      } catch (err) {
        this.error(`onPair() - initDeviceConfig: ${err}`);
        callback(err);
      }
    });

    socket.on("getDevicesConfig", async (data, callback) => {
      callback(null, [...dingzConfig.dingzDevice, ...dingzConfig.intDevices, ...dingzConfig.btnDevices]);
    });

    socket.on("getDeviceManifest", (deviceConfig, callback) => {
      const appManifest = Homey.app.manifest.drivers.find((device) => device.id === deviceConfig.deviceId);

      if (typeof appManifest !== "undefined") {
        const manifest = { ...appManifest };
        manifest.name = deviceConfig.name;
        manifest["data"] = {};
        manifest.data["id"] = `${dingzConfig.data.mac}:${deviceConfig.id}`;
        manifest.data["deviceId"] = deviceConfig.deviceId;
        manifest.data["mac"] = dingzConfig.data.mac;
        manifest.data["relativeIdx"] = deviceConfig.relativeIdx;
        manifest.data["absoluteIdx"] = deviceConfig.absoluteIdx;
        manifest["settings"] = {};
        manifest.settings["ipAddress"] = dingzConfig.data.ipAddress;

        this.debug(`onPair() - getDeviceManifest > ${JSON.stringify(manifest)}`);
        callback(null, manifest);
      } else {
        callback(Error(`Device manifest (${deviceConfig.deviceId}) not found`));
      }
    });
  }

  getDimmerDeviceId(type) {
    switch (type) {
      case "not_connected":
        return "button";
      case "non_dimmable":
        return "switch";
      default:
        return "light";
    }
  }

  getBlindDeviceId(type) {
    switch (type) {
      case "lamella_90":
        return "blind";
      default:
        return "shade";
    }
  }

  defineButtonDevices(dip, dimmers, blinds) {
    switch (dip) {
      case 0:
        this.debug("defineButtonDevices() > dip_config: [0] 2 SHADES");
        blinds[0].relativeIdx = 0;
        blinds[1].relativeIdx = 1;
        return blinds;
      case 1:
        this.debug("defineButtonDevices() > dip_config: [1] 2 DIMMERS and 1 SHADE");
        dimmers[0].relativeIdx = 0;
        dimmers[1].relativeIdx = 1;
        blinds[1].relativeIdx = 0;
        return [dimmers[0], dimmers[1], blinds[1]];
      case 2:
        this.debug("defineButtonDevices() > dip_config: [2] 1 SHADE and 2 DIMMERS");
        blinds[0].relativeIdx = 0;
        dimmers[2].relativeIdx = 0;
        dimmers[3].relativeIdx = 1;
        return [blinds[0], dimmers[2], dimmers[3]];
      case 3:
        this.debug("defineButtonDevices() > dip_config: [3] 4 DIMMERS");
        dimmers[0].relativeIdx = 0;
        dimmers[1].relativeIdx = 1;
        dimmers[2].relativeIdx = 2;
        dimmers[3].relativeIdx = 3;
        return dimmers;
      default:
        throw Error(`Unknown dip_config [${dip}]`);
    }
  }

  buttonPressedTrigger(device, tokens, state) {
    this._buttonPressedTrigger
      .trigger(device, tokens, state)
      .then(this.log(`${device.getName()} Button was ${this.getActionLabel(state.action)}-pressed`))
      .catch((err) => this.error(`buttonPressedTrigger() > ${err}`));
  }

  motionModeTrigger(device, tokens, state) {
    this._motionModeTrigger
      .trigger(device, tokens, state)
      .then(this.log(`${device.getName()} Motion detector mode to ${this.getMotionModeLabel(state.motionMode)}`))
      .catch((err) => this.error(`motionModeChanged() > ${err}`));
  }

  getActionLabel(action) {
    switch (action) {
      case DINGZ.SINGLE_PRESS:
        return "short";
      case DINGZ.DOUBLE_PRESS:
        return "double";
      case DINGZ.LONG_PRESS:
        return "long";
      default:
        return `[${action}]`;
    }
  }

  getMotionModeLabel(mode) {
    switch (mode) {
      case DINGZ.MOTION_DAY:
        return "Day";
      case DINGZ.MOTION_TWILIGHT:
        return "Twilight";
      case DINGZ.MOTION_NIGHT:
        return "Night";
      default:
        return `[${mode}]`;
    }
  }
};
