'use strict';

const { DINGZ } = require('../device');
const Device = require('../device');

module.exports = class SwitchDevice extends Device {

  onInit(options = {}) {
    super.onInit(options);

    this.registerCapabilityListener('onoff', this.onCapabilityOnOff.bind(this));

    // Temp: Until the dingz-devices event is revised
    this.homey.on('dingzButtonGenAction', (params) => {
      if (this.isActionForDevice(params)) {
        this.debug(`dingzActionEvent: dingzButtonGenAction > ${JSON.stringify(params)}`);
        switch (params.action) {
          case DINGZ.SHORT_PRESS:
          case DINGZ.DOUBLE_PRESS:
          case DINGZ.LONG_PRESS:
            this.getDeviceValues();
            break;
          default:
        }
      }
    });

    this.homey.on('measurePowerChanged', (params) => {
      if (params.output.toString() === this.data.absoluteIdx) {
        // this.debug(`dingzActionEvent: measurePowerChanged > ${JSON.stringify(params)`);
        this.setCapabilityValue('measure_power', Math.round(params.value * 10) / 10);
      }
    });
  }

  async onCapabilityOnOff(value, opts) {
    const current = this.getCapabilityValue('onoff');
    if (current === value) return Promise.resolve();

    const action = value ? 'on' : 'off';
    const ramp = (this.data.deviceId === 'switch' ? 0 : DINGZ.RAMP_DEFAULT) * 10;

    this.debug(`onCapabilityOnOff() - ${current} > ${value}`);

    return this.setDeviceData(`dimmer/${this.data.relativeIdx}/${action}/?ramp=${ramp}`)
      .then(await this.getDeviceValues())
      .then(() => {
        const val = this.getCapabilityValue('onoff') ? 'on' : 'off';
        this.notify(this.homey.__('device.stateSet', { value: val }));
      })
      .catch((err) => this.error(`onCapabilityOnOff() > ${err}`));
  }

  async getDeviceValues(url = `dimmer/${this.data.relativeIdx}`) {
    return super
      .getDeviceValues(url)
      .then(async (data) => {
        await this.setCapabilityValue('onoff', data.on);
        return data;
      })
      .catch((err) => {
        this.error(`getDeviceValues() > ${err}`);
        this.showWarning(err.message);
      });
  }

};
