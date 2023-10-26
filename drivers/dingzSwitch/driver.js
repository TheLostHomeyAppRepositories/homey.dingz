'use strict';

const { DINGZ } = require('../../lib/dingzAPI');

const BaseDriver = require('../driver');

// dingz
const DingzDevice = require('../dingz/device');
const LedDevice = require('../led/device');
// outputs
const LightDevice = require('../light/device');
const AlwaysDevice = require('../always/device');
const SwitchDevice = require('../switch/device');
const HeaterDevice = require('../heater/device');
const SprinklerDevice = require('../sprinkler/device');
const FanDevice = require('../fan/device');
const PulseDevice = require('../pulse/device');
const GaragedoorDevice = require('../garagedoor/device');
// motors
const BlindDevice = require('../blind/device');
const ShadeDevice = require('../shade/device');
const WindowDevice = require('../window/device');
const DoorDevice = require('../door/device');

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

  get dingzNet() {
    return this.homey.app.dingzNet;
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
    // v1 to v2 Compatibility
    const type = device.getData().type || device.getData().deviceId;
    switch (type) {
      // dingz
      case 'dingz':
        return DingzDevice;
      case 'led':
        return LedDevice;
      // outputs
      case 'light':
        return LightDevice;
      case 'always':
        return AlwaysDevice;
      case 'switch':
        return SwitchDevice;
      case 'heater':
        return HeaterDevice; // TODO: Specs ??
      case 'sprinkler': // aka "power_socket"
        return SprinklerDevice;
      case 'fan':
        return FanDevice; // TODO: Specs ??
      case 'pulse':
        return PulseDevice;
      case 'garagedoor':
        return GaragedoorDevice;
      // motors
      case 'blind':
        return BlindDevice;
      case 'shade': // aka "awning"
        return ShadeDevice;
      case 'window':
        return WindowDevice;
      case 'door':
        return DoorDevice;
      default:
        this.logError(`onMapDeviceClass - unknown type: ${type}`);
        return Error(`Unknown device type ${type}`);
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
        result = this.#handelDingzDevices(session, dingzSwitch);
      }
      return result;
    });

    session.setHandler('list_devices_selection', async (switches) => {
      dingzSwitch = switches[0];
      this.logDebug(`onPair() - list_devices_selection > switch: ${JSON.stringify(dingzSwitch)}`);
      return dingzSwitch;
    });
  }

  async onRepair(session, device) {
    session.setHandler('getDeviceAddress', () => {
      return device.getStoreValue('address');
    });

    session.setHandler('reconfigureDingzNet', () => {
      return device.dingzNet.publishDeviceConfig(device.getStoreValue('address'));
    });

    session.setHandler('disconnect', () => {
      // Cleanup
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
          mac: discoveryResult.txt.mac.toLowerCase(),
          address: discoveryResult.address,
          lastSeen: discoveryResult.lastSeen,
          room,
        },
      };
    })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async #handelDingzDevices(session, dingzSwitch) {
    this.logDebug(`#handelDingzDevices() > dingzSwitch: ${JSON.stringify(dingzSwitch)}`);

    await this.dingzNet.publishDeviceConfig(dingzSwitch.data.address);

    let devicesConfig = [];
    await this.dingzNet.getDingzSwitchConfig(dingzSwitch.data.address).then((config) => {
      devicesConfig = [].concat(Object.values(config.dingz), Object.values(config.outputs), Object.values(config.motors));
    });

    return devicesConfig
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter(async (device) => {
        const manifest = this.homey.manifest.drivers.find((manifest) => manifest.id === device.type);
        if (manifest === undefined || manifest.deprecated) {
          const msg = `DeviceType "${device.type}" are not supported`;
          // await session.emit('homeyAlert', msg, 'warning');
          this.logWarning(msg);
          return false;
        }
        return true;
      })
      .map((device) => {
        const manifest = { ...this.homey.manifest.drivers.find((manifest) => manifest.id === device.type) };
        manifest.name = device.name;
        manifest['data'] = manifest.data || {};
        manifest.data['id'] = device.id;
        manifest.data['mac'] = device.mac;
        manifest.data['dip'] = device.dip;
        manifest.data['model'] = device.model;
        manifest.data['type'] = device.type;
        manifest.data['device'] = device.device || '';
        manifest['store'] = manifest.store || {};
        manifest.store['address'] = dingzSwitch.data.address;

        // NOTE: Only for Test
        // this.logDebug(`onPair() > #handelDingzDevices() > manifest: ${JSON.stringify(manifest)}`);

        return manifest;
      });
  }

  triggerDingzButtonPressedFlow(device, tokens, state) {
    this.#flowTriggerDingzButtonPressed
      .trigger(device, tokens, state)
      .then(() => device.logNotice(`DingzButton-${state.index} was '${this.#getActionLabel(state.action)}' pressed`))
      .catch((error) => this.logError(`triggerDingzButtonPressedFlow() > ${error}`));
  }

  triggerLightStateChangedFlow(device, tokens, state) {
    this.#flowTriggerLightStateChanged
      .trigger(device, tokens, state)
      .then(() => device.logNotice(`Light state changed to ${state.lightState}`))
      .catch((error) => this.logError(`triggerLightStateChangedFlow() > ${error}`));
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
