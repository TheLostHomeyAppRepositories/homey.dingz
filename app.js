'use strict';

const { MyApp, HttpAPI } = require('my-homey');

const { DINGZ } = require('./lib/dingzAPI');
const DingzNet = require('./lib/dingzNet');

module.exports = class DingzApp extends MyApp {

  #dingzNet;

  static get DINGZ() {
    return DINGZ;
  }

  async onInit() {
    super.onInit();
    this.onceDay = null;
    this.rootTopic = 'dingz/dingzNet';

    this.#dingzNet = new DingzNet(this);
    await this.#dingzNet.initDingzNet(this.getMqttBrokerUri());
  }

  getMqttBrokerUri() {
    // TODO: getMqttBrokerUri()
    // const mqttUrl = `mqtt://${mqttUserElement.value ==! "" ? `${mqttUserElement.value}:${mqttPasswordElement.value}@` : "" }${mqttBrokerElement.value}:${mqttPortElement.value}`;
    return 'mqtt://mqttUser:mqttPasswd@192.168.50.11:1883'; // HP2023
    // return 'mqtt://mqttUser:mqttPasswd@192.168.50.15:1883/'; // homeassistant
  }

  async getDingzSwitchConfig(address) {
    this.logDebug(`getDingzSwitchConfig() > ${address}`);

    const config = {};

    try {
      const httpAPI = new HttpAPI(this, `http://${address}/api/v1/`);

      await httpAPI.get('device').then((data) => {
        config['mac'] = Object.keys(data)[0].toLowerCase();
        config['dip_config'] = Object.values(data)[0].dip_config;
        config['firmware'] = Object.values(data)[0].fw_version;
        config['model'] = Object.values(data)[0].front_hw_model;
      });

      await httpAPI.get('system_config').then((system) => {
        config['name'] = system.dingz_name || '';
        config['roomName'] = system.room_name || '';
      });

      config['dingz'] = {
        0: {
          id: `${config.mac}:dingz`,
          mac: config.mac,
          type: 'dingz',
          name: `${config.name} dingz`,
          model: config.model,
          firmware: config.firmware,
          device: '',
        },
        1: {
          id: `${config.mac}:led`,
          mac: config.mac,
          type: 'led',
          name: `${config.name} led`,
          model: config.model,
          firmware: config.firmware,
          device: '',
        },
      };

      config['outputs'] = {};
      await httpAPI.get('output_config').then((data) => {
        data.outputs.forEach((output, number) => {
          config['outputs'] = {
            [number]: {
              ...output,
              id: `${config.mac}:output:${number}`,
              mac: config.mac,
              type: output.type === 'power_socket' ? 'switch' : output.type,
              name: `${config.name} ${`${!output.name ? `Output-${number + 1}` : output.name}`}`,
              model: config.model,
              firmware: config.firmware,
            },
            ...config['outputs'],
          };
        });
      });

      config['motors'] = {};
      await httpAPI.get('blind_config').then((data) => {
        data.blinds.forEach((motor, number) => {
          config['motors'] = {
            [number]: {
              ...motor,
              id: `${config.mac}:motor:${number}`,
              mac: config.mac,
              type: motor.type === 'awning' ? 'shade' : motor.type,
              name: `${config.name} ${`${!motor.name ? `Motor-${number + 1}` : motor.name}`}`,
              model: config.model,
              firmware: config.firmware,
            },
            ...config['motors'],
          };
        });
      });

      config['buttons'] = {};
      await httpAPI.get('button_config').then((data) => {
        data.buttons.forEach((button, number) => {
          config['buttons'] = {
            [number]: {
              id: `${config.mac}:button:${number}`,
              mac: config.mac,
              name: `${config.name} ${`${!button.name ? `Button-${number + 1}` : button.name}`}`,
              device: number,
              homeyButton: !(button.mode.local || button.mode.remote || button.therm_ctrl),
            },
            ...config['buttons'],
          };
        });
      });
    } catch (err) {
      this.logError(`setDeviceDipConfig() > ${err}`);
      throw new Error(`dingzSwitch error ${err}`);
    }

    switch (config.dip_config) {
      case 0:
        this.logDebug('setDeviceDipConfig() > dip_config: [0] 2 MOTORS');
        config.outputs = {};
        config.motors[0].device = '0';
        config.motors[1].device = '1';
        break;
      case 1:
        this.logDebug('setDeviceDipConfig() > dip_config: [1] 2 OUTPUTS and 1 MOTOR');
        config.outputs[0].device = '0';
        config.outputs[1].device = '1';
        delete config.outputs[2];
        delete config.outputs[3];
        delete config.motors[0];
        config.motors[1].device = '0';
        break;
      case 2:
        this.logDebug('setDeviceDipConfig() > dip_config: [2] 1 MOTOR and 2 OUTPUTS');
        config.motors[0].device = '0';
        delete config.motors[1];
        delete config.outputs[0];
        delete config.outputs[1];
        config.outputs[2].device = '0';
        config.outputs[3].device = '1';
        break;
      case 3:
        this.logDebug('setDeviceDipConfig() > dip_config: [3] 4 OUTPUTS');
        config.outputs[0].device = '0';
        config.outputs[1].device = '1';
        config.outputs[2].device = '2';
        config.outputs[3].device = '3';
        config.motors = {};
        break;
      default:
        this.logError(`setDeviceDipConfig() > Unknown dip_config [${config.dip_config}]`);
        throw new Error(`Unknown dip_config [${config.dip_config}]`);
    }

    // NOTE: Only for Test
    this.logDebug(`getDingzSwitchConfig() < ${JSON.stringify(config)}`);

    return config;
  }

  notifyDeviceWarning() {
    // Only once a day
    if (this.onceDay !== new Date().toLocaleDateString()) {
      this.onceDay = new Date().toLocaleDateString();
      this.notifyError('Your dingz devices are no longer working properly. Please read the "[App][Pro] dingz" documentation');
    }
  }

  // NOTE: simplelog-api on/off

  logDebug(msg) {
    if (process.env.DEBUG === '1') {
      super.logDebug(msg);
    }
  }

};
