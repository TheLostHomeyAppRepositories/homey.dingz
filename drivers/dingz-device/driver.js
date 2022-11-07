'use strict';

// const { DINGZ } = require('../device');
const Driver = require('../driver');

const LedDevice = require('../led/device');
const SwitchDevice = require('../switch/device');
const LightDevice = require('../light/device');
const ShadeDevice = require('../shade/device');
const BlindDevice = require('../blind/device');

module.exports = class DevicesDriver extends Driver {

  async onInit(options = {}) {
    super.onInit(options);
  }

  onMapDeviceClass(device) {
    switch (device.getData().deviceId) {
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
        this.error(`onMapDeviceClass - unknown deviceId: ${device.getData().deviceId}`);
        return Error(`Unknown Device-id ${device.getData().deviceId}`);
    }
  }

  async onPair(session) {
    let dingzSwitch = {};
    let dingzDevices = [];

    session.setHandler('list_devices', async () => {
      return Object.values(await this.homey.app.api.devices.getDevices())
        // .filter((device) => device.driverId === 'dingz')     >> fw: 1.4x
        .filter((device) => device.data.deviceId === 'dingz')
        .map((device) => {
          // this.debug(`onPair() - list_devices > device: ${JSON.stringify(device)}`);
          return {
            name: `${device.zoneName} - ${device.name}`,
            data: {
              name: device.name.trim(),
              zone: device.zoneName.trim(),
              id: device.data.id,
              mac: device.data.mac,
              address: device.settings.labelAddress,
            },
          };
        })
        .sort((a, b) => (a.name > b.name ? 1 : -1));
    });

    session.setHandler('list_devices_selection', async (switches) => {
      dingzSwitch = switches[0];
      this.debug(`onPair() - list_devices_selection > switch: ${JSON.stringify(dingzSwitch)}`);
      return dingzSwitch;
    });

    session.setHandler('getDingzSwitch', () => {
      return dingzSwitch;
    });

    session.setHandler('getDingzDevice', async () => {
      try {
        const device = Object.values(await this.httpAPI.get(`http://${dingzSwitch.data.address}/api/v1/device`))[0];
        const dip = device.dip_config;

        // Dimmer-Devices
        let { dimmers } = await this.httpAPI.get(`http://${dingzSwitch.data.address}/api/v1/dimmer_config`);
        dimmers = dimmers.map((elm, idx) => {
          const name = `${dingzSwitch.data.name} ${`${!elm.name ? `Dimmer-${idx + 1}` : elm.name}`}`;
          return {
            id: `${dingzSwitch.data.id}:dimmer:${idx}`,
            absoluteIdx: idx.toString(),
            deviceId: this.getDimmerDeviceId(elm.output),
            name,
          };
        });

        // Blind-Devices
        let { blinds } = await this.httpAPI.get(`http://${dingzSwitch.data.address}/api/v1/blind_config`);
        blinds = blinds.map((elm, idx) => {
          const name = `${dingzSwitch.data.name} ${`${!elm.name ? `Blind-${idx + 1}` : elm.name}`}`;
          return {
            id: `${dingzSwitch.data.id}:blind:${idx}`,
            absoluteIdx: idx.toString(),
            deviceId: this.getBlindDeviceId(elm.type),
            name,
          };
        });

        dingzDevices = this.setDeviceDipConfig(dip, dimmers, blinds);
        dingzDevices = [{ id: `${dingzSwitch.data.id}:led`, deviceId: 'led', name: `${dingzSwitch.data.name} led` }, ...dingzDevices];

        this.debug(`onPair() - getDingzDevice > ${JSON.stringify(dingzDevices)}`);
        return dingzDevices;
      } catch (err) {
        this.error(`onPair() - getDingzDevice: ${err}`);
        return err;
      }
    });

    session.setHandler('getDeviceManifests', async () => {
      // const homeyDevices = Object.values(await this.homey.app.api.devices.getDevices());
      return dingzDevices
        .filter((device) => device.deviceId !== '[none]')
        // .filter((device) => !homeyDevices.some((homeyDevice) => homeyDevice.id === device.id))
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
          // FIX: ... error
          manifest['settings'] = {};

          this.debug(`onPair() - getDeviceManifests > device: ${JSON.stringify(manifest)}`);
          return manifest;
        });
    });
  }

  getDimmerDeviceId(type) {
    switch (type) {
      case 'not_connected':
        return '[none]';
      case 'non_dimmable':
        return 'switch';
      default:
        return 'light';
    }
  }

  getBlindDeviceId(type) {
    switch (type) {
      case 'lamella_90':
        return 'blind';
      default:
        return 'shade';
    }
  }

  setDeviceDipConfig(dip, dimmers, blinds) {
    switch (dip) {
      case 0:
        this.debug('setDeviceDipConfig() > dip_config: [0] 2 SHADES');
        blinds[0].relativeIdx = '0';
        blinds[1].relativeIdx = '1';
        return blinds;
      case 1:
        this.debug('setDeviceDipConfig() > dip_config: [1] 2 DIMMERS and 1 SHADE');
        dimmers[0].relativeIdx = '0';
        dimmers[1].relativeIdx = '1';
        blinds[1].relativeIdx = '0';
        return [dimmers[0], dimmers[1], blinds[1]];
      case 2:
        this.debug('setDeviceDipConfig() > dip_config: [2] 1 SHADE and 2 DIMMERS');
        blinds[0].relativeIdx = '0';
        dimmers[2].relativeIdx = '0';
        dimmers[3].relativeIdx = '1';
        return [blinds[0], dimmers[2], dimmers[3]];
      case 3:
        this.debug('setDeviceDipConfig() > dip_config: [3] 4 DIMMERS');
        dimmers[0].relativeIdx = '0';
        dimmers[1].relativeIdx = '1';
        dimmers[2].relativeIdx = '2';
        dimmers[3].relativeIdx = '3';
        return dimmers;
      default:
        throw Error(`Unknown dip_config [${dip}]`);
    }
  }

};
