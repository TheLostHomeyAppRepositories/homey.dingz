'use strict';

const { HttpAPI } = require('my-homey');

const { DINGZ } = require('../../lib/dingzAPI');

const BaseDriver = require('../driver');

const DingzDevice = require('../dingz/device');
const LedDevice = require('../led/device');
const SwitchDevice = require('../switch/device');
const LightDevice = require('../light/device');
const ShadeDevice = require('../shade/device');
const BlindDevice = require('../blind/device');

module.exports = class DingzSwitchDriver extends BaseDriver {

  #flowTriggerDingzButtonPressed;
  #flowTriggerLightStateChanged;
  #lightStateCondition;
  #rampAction;
  #dingzLedColorSetAction;
  #windowcoveringsTiltSetAction;

  static get DINGZ() {
    return DINGZ;
  }

  onInit(options = {}) {
    super.onInit(options);

    // Create flow-cards
    this.#flowTriggerDingzButtonPressed = this.homey.flow.getDeviceTriggerCard('dingzButton_pressed');
    this.#flowTriggerDingzButtonPressed
      .registerRunListener((args, state) => args.button.id === state.index && args.action === state.action)
      .getArgument('button')
      .registerAutocompleteListener((query, args) => args.device.onDingzButtonAutocomplete(query, args));

    this.#flowTriggerLightStateChanged = this.homey.flow.getDeviceTriggerCard('lightState_changed');
    this.#flowTriggerLightStateChanged
      .registerRunListener((args, state) => args.lightState === state.lightState);

    this.#lightStateCondition = this.homey.flow.getConditionCard('is_lightState');
    this.#lightStateCondition
      .registerRunListener((args, state) => args.device.getCapabilityValue('light_state') === args.lightState);

    this.#rampAction = this.homey.flow.getActionCard('ramp');
    this.#rampAction
      .registerRunListener((args, state) => args.device.onCapabilityDim(args, {}));

    this.#dingzLedColorSetAction = this.homey.flow.getActionCard('dingzLedColor_set');
    this.#dingzLedColorSetAction
      .registerRunListener((args, state) => args.device.onCapabilityDingzLedColor(args, {}));

    this.#windowcoveringsTiltSetAction = this.homey.flow.getActionCard('windowcoverings_tilt_set');
    this.#windowcoveringsTiltSetAction
      .registerRunListener((args, state) => args.device.onCapabilityWindowCoveringsTiltSet(args.value, {}));
  }

  onMapDeviceClass(device) {
    switch (device.getData().deviceId) {
      case 'dingz':
        return DingzDevice;
      case 'led':
        return LedDevice;
      case 'switch':
        return SwitchDevice;
      case 'light':
        return LightDevice;
      case 'shade':
        return ShadeDevice;
      case 'blind':
        return BlindDevice;
      default:
        this.logError(`onMapDeviceClass - unknown deviceId: ${device.getData().deviceId}`);
        return Error(`Unknown Device-id ${device.getData().deviceId}`);
    }
  }

  async onPair(session) {
    let dingzSwitch = {};
    let selectDingzSwitch = true;

    const discoveryStrategy = this.getDiscoveryStrategy();

    session.setHandler('getDingzSwitch', () => {
      return dingzSwitch;
    });

    session.setHandler('showView', async (viewId) => {
      if (viewId === 'switch_webUI') selectDingzSwitch = false;
    });

    session.setHandler('list_devices', async () => {
      let result;
      if (selectDingzSwitch) {
        result = this.#handelDingzSwitches(Object.values(discoveryStrategy.getDiscoveryResults()));
      } else {
        result = this.#handelDingzDevices(dingzSwitch);
      }
      return result;
    });

    session.setHandler('list_devices_selection', async (switches) => {
      dingzSwitch = switches[0];
      this.logDebug(`onPair() - list_devices_selection > switch: ${JSON.stringify(dingzSwitch)}`);
      return dingzSwitch;
    });
  }

  #handelDingzSwitches(discoveryResults) {
    return discoveryResults.map((discoveryResult) => {
      // this.logDebug(`onPair() - list_devices > discoveryResult: ${JSON.stringify(discoveryResult)}`);
      const room = (!discoveryResult.txt.room ? '' : discoveryResult.txt.room).trim();
      const name = (discoveryResult.txt.name || discoveryResult.name).trim();
      return {
        name,
        data: {
          id: discoveryResult.id,
          mac: discoveryResult.txt.mac,
          address: discoveryResult.address,
          lastSeen: discoveryResult.lastSeen,
          room,
        },
      };
    })
      .sort((a, b) => (a.name > b.name ? 1 : -1));
  }

  async #handelDingzDevices(dingzSwitch) {
    try {
      const httpAPI = new HttpAPI(this, `http://${dingzSwitch.data.address}/api/v1/`);

      let dingzDevices;

      const device = Object.values(await httpAPI.get('device'))[0];
      const dip = device.dip_config;

      // Dimmer-Devices
      let { dimmers } = await httpAPI.get('dimmer_config');
      dimmers = dimmers.map((elm, idx) => {
        return {
          id: `${dingzSwitch.data.id}:dimmer:${idx}`,
          absoluteIdx: idx.toString(),
          deviceId: this.#getDimmerDeviceId(elm),
          name: `${dingzSwitch.name} ${`${!elm.name ? `Dimmer-${idx + 1}` : elm.name}`}`,
        };
      });

      // Blind-Devices
      let { blinds } = await httpAPI.get('blind_config');
      blinds = blinds.map((elm, idx) => {
        return {
          id: `${dingzSwitch.data.id}:blind:${idx}`,
          absoluteIdx: idx.toString(),
          deviceId: elm.type,
          name: `${dingzSwitch.name} ${`${!elm.name ? `Blind-${idx + 1}` : elm.name}`}`,
        };
      });

      dingzDevices = this.#setDeviceDipConfig(dip, dimmers, blinds)
        .sort((a, b) => (a.name > b.name ? 1 : -1));

      dingzDevices = [
        { id: `${dingzSwitch.data.id}:dingz`, deviceId: 'dingz', name: `${dingzSwitch.name} dingz` },
        { id: `${dingzSwitch.data.id}:led`, deviceId: 'led', name: `${dingzSwitch.name} led` },
        ...dingzDevices,
      ];

      return dingzDevices
        .filter((device) => device.deviceId !== '[none]')
        .map((device) => {
          const deviceManifest = this.homey.manifest.drivers.find((manifest) => manifest.id === device.deviceId);
          if (deviceManifest === undefined) {
            throw Error(`Device manifest (${device.deviceId}) not found`);
          }
          const manifest = { ...deviceManifest };
          manifest.name = device.name;
          manifest['data'] = manifest.data || {};
          manifest.data['id'] = device.id;
          manifest.data['deviceId'] = device.deviceId;
          manifest.data['mac'] = dingzSwitch.data.mac;
          manifest.data['relativeIdx'] = device.relativeIdx || '';
          manifest.data['absoluteIdx'] = device.absoluteIdx || '';
          manifest['store'] = manifest.store || {};
          manifest.store['address'] = dingzSwitch.data.address;
          manifest['settings'] = manifest.settings || {};
          manifest.settings['address'] = dingzSwitch.data.address;
          manifest.settings['lastSeen'] = this.localDateTimeFormater().format(new Date(dingzSwitch.data.lastSeen));

          // this.logDebug(`onPair() > #handelDingzDevices() > manifest: ${JSON.stringify(manifest)}`);
          return manifest;
        });
    } catch (err) {
      this.logError(`onPair() - list_devices: ${err}`);
      return err;
    }
  }

  #getDimmerDeviceId(dimmer) {
    if (dimmer.active) {
      if (dimmer.type === 'light') {
        if (dimmer.light.dimmable) {
          return 'light';
        }
        return 'switch';
      }
    }
    return '[none]';
  }

  #setDeviceDipConfig(dip, dimmers, blinds) {
    switch (dip) {
      case 0:
        this.logDebug('setDeviceDipConfig() > dip_config: [0] 2 SHADES');
        blinds[0].relativeIdx = '0';
        blinds[1].relativeIdx = '1';
        return blinds;
      case 1:
        this.logDebug('setDeviceDipConfig() > dip_config: [1] 2 DIMMERS and 1 SHADE');
        dimmers[0].relativeIdx = '0';
        dimmers[1].relativeIdx = '1';
        blinds[1].relativeIdx = '0';
        return [dimmers[0], dimmers[1], blinds[1]];
      case 2:
        this.logDebug('setDeviceDipConfig() > dip_config: [2] 1 SHADE and 2 DIMMERS');
        blinds[0].relativeIdx = '0';
        dimmers[2].relativeIdx = '0';
        dimmers[3].relativeIdx = '1';
        return [blinds[0], dimmers[2], dimmers[3]];
      case 3:
        this.logDebug('setDeviceDipConfig() > dip_config: [3] 4 DIMMERS');
        dimmers[0].relativeIdx = '0';
        dimmers[1].relativeIdx = '1';
        dimmers[2].relativeIdx = '2';
        dimmers[3].relativeIdx = '3';
        return dimmers;
      default:
        throw Error(`Unknown dip_config [${dip}]`);
    }
  }

  triggerDingzButtonPressedFlow(device, tokens, state) {
    this.#flowTriggerDingzButtonPressed
      .trigger(device, tokens, state)
      .then(() => device.logNotice(`DingzButton-${state.index} was '${this.#getActionLabel(state.action)}' pressed`))
      .catch((err) => this.logError(`triggerDingzButtonPressedFlow() > ${err}`));
  }

  triggerLightStateChangedFlow(device, tokens, state) {
    this.#flowTriggerLightStateChanged
      .trigger(device, tokens, state)
      .then(() => device.logNotice(`Light state changed to ${state.lightState}`))
      .catch((err) => this.logError(`triggerLightStateChangedFlow() > ${err}`));
  }

  #getActionLabel(action) {
    switch (action) {
      case DINGZ.SHORT_PRESS:
        return 'SHORT';
      case DINGZ.DOUBLE_PRESS:
        return 'DOUBLE';
      case DINGZ.LONG_PRESS:
        return 'LONG';
      default:
        return `[${action}]`;
    }
  }

  // Helper
  localDateTimeFormater() {
    return new Intl.DateTimeFormat('de-CH', {
      dateStyle: 'short',
      timeStyle: 'medium',
      timeZone: this.homey.clock.getTimezone(),
    });
  }

};
