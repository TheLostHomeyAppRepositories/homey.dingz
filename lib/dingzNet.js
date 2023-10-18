'use strict';

const { MySimpleClass, MqttClient, HttpAPI } = require('my-homey');

module.exports = class DingzNet extends MySimpleClass {

  #mqttClient;

  constructor(owner) {
    super(owner);

    // this.#mqttClient = new MqttClient(this, this.homey.app.rootTopic);
    this.#mqttClient = MqttClient.getInstance(this, this.homey.app.rootTopic);
  }

  async initDingzNet(uri) {
    const myUrl = new URL(uri);
    const delay = (ms) => new Promise((resolve) => this.homey.setTimeout(resolve, ms));

    this.logDebug(`Initialize dingzNet > uri: ${uri}`);

    await this.#mqttClient
      .connect(uri)
      .then((client) => {
        client
          .on('message', this.onMessage.bind(this))
          .on('connect', (connack) => {
            this.logDebug(`initDingzNet() > connect > ${JSON.stringify(connack)}`);
            this.#mqttClient.subscribe('dingz/+/announce');
          });
      })
      .then(() => delay(1000))
      .then(() => this.logNotice(`dingzNet started - MQTT Broker: ${myUrl.host}`))
      .catch((error) => {
        this.logError(`initDingzNet() ${error}`);
        throw new Error(`Initialize dingzNet ${error.message}`);
      });
  }

  async onMessage(topic, message) {
    const msg = message.toString();

    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      data = msg;
    }

    if (topic.includes('/announce')) {
      this.logDebug(`onMessage() > topic: ${topic} msg: ${msg}`);
      await this.getDingzSwitchConfig(data.ip).then((config) => this.#publishConfig(config));
    }
  }

  #publishConfig(config) {
    this.logDebug(`#publishConfig() > config: ${config.name}`);

    [].concat(Object.values(config.dingz), Object.values(config.outputs), Object.values(config.motors), Object.values(config.buttons))
      .forEach((element) => {
        this.#mqttClient.publish(`${this.homey.app.rootTopic}/config/${element.id.replaceAll(':', '/')}`, JSON.stringify(element), { retain: true });
      });
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
          dip: config.dip_config,
          type: 'dingz',
          name: `${config.name} dingz`,
          model: config.model,
          firmware: config.firmware,
          device: '',
        },
        1: {
          id: `${config.mac}:led`,
          mac: config.mac,
          dip: config.dip_config,
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
              dip: config.dip_config,
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
              dip: config.dip_config,
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
              dip: config.dip_config,
              name: `${config.name} ${`${!button.name ? `Button-${number + 1}` : button.name}`}`,
              device: number,
              homeyButton: !(button.mode.local || button.mode.remote || button.therm_ctrl),
            },
            ...config['buttons'],
          };
        });
      });
    } catch (error) {
      this.logError(`setDeviceDipConfig() > ${error}`);
      throw new Error(`dingzSwitch error ${error}`);
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

};
