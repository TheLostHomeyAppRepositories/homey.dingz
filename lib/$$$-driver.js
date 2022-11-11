'use strict';

const { DINGZ } = require('../device');

const Driver = require('../driver');

module.exports = class DingzDriver extends Driver {

  onInit(options = {}) {
    super.onInit(options);

    // Create flow-cards
    this.__flowTriggerDingzButtonPressed = this.homey.flow.getDeviceTriggerCard('dingzButton_pressed');
    this.__flowTriggerDingzButtonPressed
      .registerRunListener((args, state) => args.button.id === state.index && args.action === state.action)
      .getArgument('button')
      .registerAutocompleteListener((query, args) => args.device.onDingzButtonAutocomplete(query, args));

    this.__flowTriggerLightStateChanged = this.homey.flow.getDeviceTriggerCard('lightState_changed');
    this.__flowTriggerLightStateChanged
      .registerRunListener((args, state) => args.lightState === state.lightState);

    this._lightStateCondition = this.homey.flow.getConditionCard('is_lightState');
    this._lightStateCondition
      .registerRunListener((args, state) => args.device.getCapabilityValue('light_state') === args.lightState);

    this._rampAction = this.homey.flow.getActionCard('ramp');
    this._rampAction
      .registerRunListener((args, state) => args.device.onCapabilityDim(args, {}));

    this._windowcoveringsTiltSetAction = this.homey.flow.getActionCard('windowcoverings_tilt_set');
    this._windowcoveringsTiltSetAction
      .registerRunListener((args, state) => args.device.onCapabilityWindowCoveringsTiltSet(args.value, {}));
  }

  onPair(session) {
    const discoveryStrategy = this.getDiscoveryStrategy();
    let dingzSwitch = {};

    session.setHandler('list_devices', async (data) => {
      const discoveryResults = Object.values(discoveryStrategy.getDiscoveryResults());

      const devices = discoveryResults
        // TempFix get always this.getDevice() > Error: invalid_device
        // .filter((discoveryResult) => this.getDevice({ id: discoveryResult.id }) instanceof Error)
        .filter((discoveryResult) => !this.getDevices().some((device) => device.data.id === discoveryResult.id))
        .map((discoveryResult) => {
          // this.debug(`onPair() - list_devices > discoveryResult: ${JSON.stringify(discoveryResult)}`);
          const room = (!discoveryResult.txt.room ? '' : discoveryResult.txt.room).trim();
          const dingzName = (discoveryResult.txt.name || discoveryResult.name).trim();
          return {
            name: dingzName,
            data: {
              id: discoveryResult.id,
              mac: discoveryResult.txt.mac,
              deviceId: 'dingz', // TempFix v1.4x
              room,
              dingzName,
            },
            store: {
              address: discoveryResult.address,
            },
          };
        })
        .sort((a, b) => (a.name > b.name ? 1 : -1));

      return devices;
    });

    session.setHandler('list_devices_selection', async (switches) => {
      dingzSwitch = switches[0];
      this.debug(`onPair() - list_devices_selection > switch: ${JSON.stringify(dingzSwitch)}`);
      return dingzSwitch;
    });

    session.setHandler('getDingzSwitch', () => {
      return dingzSwitch;
    });
  }

  triggerDingzButtonPressedFlow(device, tokens, state) {
    this.__flowTriggerDingzButtonPressed
      .trigger(device, tokens, state)
      .then(this.log(`${device.getName()} dingzButton ${state.index} was '${this.getActionLabel(state.action)}' pressed`))
      .catch((err) => this.error(`triggerDingzButtonPressedFlow() > ${err}`));
  }

  triggerLightStateChangedFlow(device, tokens, state) {
    this.__flowTriggerLightStateChanged
      .trigger(device, tokens, state)
      .then(this.log(`${device.getName()} light state changed to ${state.lightState}`))
      .catch((err) => this.error(`triggerLightStateChangedFlow() > ${err}`));
  }

  getActionLabel(action) {
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

};
