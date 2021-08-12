"use strict";

const Homey = require("homey");
const Http = require("../../lib/http");

const { DINGZ } = require("../device");

const Driver = require("../driver");
const DingzDevice = require("./device");
const LedDevice = require("../led/device");
const SwitchDevice = require("../switch/device");
const LightDevice = require("../light/device");
const ShadeDevice = require("../shade/device");
const BlindDevice = require("../blind/device");

module.exports = class DingzDriver extends Driver {
  onInit(options = {}) {
    super.onInit(options);

    this.http = new Http();

    // Create flow-cards
    this._triggerDingzButton = new Homey.FlowCardTriggerDevice("dingzButton_pressed");
    this._triggerDingzButton
      .register()
      .registerRunListener((args, state) => args.button.id === state.index && args.action === state.action)
      .getArgument("button")
      .registerAutocompleteListener((query, args, callback) =>
        args.device.onDingzButtonAutocomplete(query, args, callback)
      );

    this._lightStateTrigger = new Homey.FlowCardTriggerDevice("lightState_changed")
      .register()
      .registerRunListener((args, state) => args.lightState === state.lightState);

    this._lightStateCondition = new Homey.FlowCardCondition("is_lightState")
      .register()
      .registerRunListener((args, state) => args.device.getCapabilityValue("light_state") === args.lightState);

    this._rampAction = new Homey.FlowCardAction("ramp")
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
    const dingzConfig = {};
    const discoveryStrategy = this.getDiscoveryStrategy();

    socket.on("list_devices", (data, callback) => {
      const discoveryResults = Object.values(discoveryStrategy.getDiscoveryResults());

      const devices = discoveryResults
        // TempFix get always this.getDevice() > Error: invalid_device
        // .filter((discoveryResult) => this.getDevice({ id: discoveryResult.id }) instanceof Error)
        .filter((discoveryResult) => !this.getDevices().some((device) => device.data.id === discoveryResult.id))
        .map((discoveryResult) => {
          this.debug(`onPair() - list_devices > discoveryResult: ${JSON.stringify(discoveryResult)}`);
          const roomName = !discoveryResult.txt.room ? "" : discoveryResult.txt.room;
          const dingzName = discoveryResult.txt.name || discoveryResult.name;
          return {
            name: !roomName ? dingzName : `${roomName} - ${dingzName}`,
            data: {
              id: discoveryResult.id,
              mac: discoveryResult.txt.mac,
              address: discoveryResult.address,
              roomName,
              dingzName,
            },
          };
        })
        .sort((a, b) => (a.name > b.name ? 1 : -1));

      callback(null, devices);
    });

    socket.on("list_devices_selection", (data, callback) => {
      this.debug(`onPair() - list_devices_selection > data: ${JSON.stringify(data[0])}`);
      Object.assign(dingzConfig, data[0].data);
      callback();
    });

    socket.on("getDingzConfig", (data, callback) => {
      callback(null, dingzConfig);
    });

    socket.on("initDingzConfig", async (data, callback) => {
      try {
        const device = Object.values(await this.http.get(`http://${dingzConfig.address}/api/v1/device`))[0];
        const dip = device.dip_config;

        const system = await this.http.get(`http://${dingzConfig.address}/api/v1/system_config`);
        const roomName = system.room_name;
        const dingzName = !system.dingz_name ? dingzConfig.dingzName : system.dingz_name;
        const deviceName = !roomName ? dingzName : `${roomName} ${dingzName}`;

        // Dimmer-Devices
        let { dimmers } = await this.http.get(`http://${dingzConfig.address}/api/v1/dimmer_config`);
        dimmers = dimmers.map((elm, idx) => {
          const name = `${deviceName} ${`${!elm.name ? `Dimmer-${idx + 1}` : elm.name}`}`;
          return {
            id: `${dingzConfig.id}:dimmer:${idx}`,
            absoluteIdx: idx.toString(),
            deviceId: this.getDimmerDeviceId(elm.output),
            name,
          };
        });

        // Blind-Devices
        let { blinds } = await this.http.get(`http://${dingzConfig.address}/api/v1/blind_config`);
        blinds = blinds.map((elm, idx) => {
          const name = `${deviceName} ${`${!elm.name ? `Blind-${idx + 1}` : elm.name}`}`;
          return {
            id: `${dingzConfig.id}:blind:${idx}`,
            absoluteIdx: idx.toString(),
            deviceId: this.getBlindDeviceId(elm.type),
            name,
          };
        });

        dingzConfig.roomName = roomName;
        dingzConfig.dingzName = dingzName;
        dingzConfig.deviceName = deviceName;
        dingzConfig["dingzSwitch"] = [{ id: dingzConfig.id, deviceId: "dingz", name: deviceName }];
        dingzConfig["intDevices"] = [{ id: `${dingzConfig.id}:led`, deviceId: "led", name: `${deviceName} led` }];
        dingzConfig["dingzDevices"] = await this.defineDingzDevices(dip, dimmers, blinds);

        this.debug(`onPair() - initDeviceConfig > ${JSON.stringify(dingzConfig)}`);
        callback(null, dingzConfig);
      } catch (err) {
        this.error(`onPair() - initDeviceConfig: ${err}`);
        callback(err);
      }
    });

    socket.on("getDevicesConfig", async (data, callback) => {
      const devicesConfig = [...dingzConfig.dingzSwitch, ...dingzConfig.intDevices, ...dingzConfig.dingzDevices];
      this.debug(`onPair() - getDevicesConfig > ${JSON.stringify(devicesConfig)}`);
      callback(null, devicesConfig);
    });

    socket.on("getDeviceManifest", (deviceConfig, callback) => {
      const appManifest = Homey.app.manifest.drivers.find((device) => device.id === deviceConfig.deviceId);

      if (typeof appManifest !== "undefined") {
        const manifest = { ...appManifest };
        manifest.name = deviceConfig.name;
        manifest["data"] = manifest.data || {};
        manifest.data["id"] = deviceConfig.id;
        manifest.data["deviceId"] = deviceConfig.deviceId;
        manifest.data["mac"] = dingzConfig.mac;
        manifest.data["relativeIdx"] = deviceConfig.relativeIdx || "";
        manifest.data["absoluteIdx"] = deviceConfig.absoluteIdx || "";
        manifest["store"] = manifest.store || {};
        manifest.store["address"] = dingzConfig.address;
        // FIX: ... error
        manifest["settings"] = {};

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
        return "[none]";
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

  defineDingzDevices(dip, dimmers, blinds) {
    switch (dip) {
      case 0:
        this.debug("defineDingzDevices() > dip_config: [0] 2 SHADES");
        blinds[0].relativeIdx = "0";
        blinds[1].relativeIdx = "1";
        return blinds;
      case 1:
        this.debug("defineDingzDevices() > dip_config: [1] 2 DIMMERS and 1 SHADE");
        dimmers[0].relativeIdx = "0";
        dimmers[1].relativeIdx = "1";
        blinds[1].relativeIdx = "0";
        return [dimmers[0], dimmers[1], blinds[1]];
      case 2:
        this.debug("defineDingzDevices() > dip_config: [2] 1 SHADE and 2 DIMMERS");
        blinds[0].relativeIdx = "0";
        dimmers[2].relativeIdx = "0";
        dimmers[3].relativeIdx = "1";
        return [blinds[0], dimmers[2], dimmers[3]];
      case 3:
        this.debug("defineDingzDevices() > dip_config: [3] 4 DIMMERS");
        dimmers[0].relativeIdx = "0";
        dimmers[1].relativeIdx = "1";
        dimmers[2].relativeIdx = "2";
        dimmers[3].relativeIdx = "3";
        return dimmers;
      default:
        throw Error(`Unknown dip_config [${dip}]`);
    }
  }

  dingzButtonPressedTrigger(device, tokens, state) {
    this._triggerDingzButton
      .trigger(device, tokens, state)
      .then(
        this.log(`${device.getName()} dingzButton ${state.index} was '${this.getActionLabel(state.action)}' pressed`)
      )
      .catch((err) => this.error(`dingzButtonPressedTrigger() > ${err}`));
  }

  lightStateTrigger(device, tokens, state) {
    this._lightStateTrigger
      .trigger(device, tokens, state)
      .then(this.log(`${device.getName()} light state changed to ${state.lightState}`))
      .catch((err) => this.error(`lightStateTrigger() > ${err}`));
  }

  getActionLabel(action) {
    switch (action) {
      case DINGZ.SHORT_PRESS:
        return "SHORT";
      case DINGZ.DOUBLE_PRESS:
        return "DOUBLE";
      case DINGZ.LONG_PRESS:
        return "LONG";
      default:
        return `[${action}]`;
    }
  }
};
