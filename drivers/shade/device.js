'use strict';

const Device = require('../device');

module.exports = class ShadeDevice extends Device {

  onInit(options = {}) {
    super.onInit(options);

    this.registerCapabilityListener('windowcoverings_set', this.onCapabilityWindowCoveringsSet.bind(this));
  }

  waitForPosition() {
    return new Promise((resolve, reject) => {
      const that = this;
      // IIFE-Expression
      // eslint-disable-next-line consistent-return
      (async function wait() {
        const data = await that.getDeviceValues();
        if (data.current.blind === data.target.blind && data.current.lamella === data.target.lamella) {
          return resolve();
        }
        setTimeout(wait, 2000);
      }());
    }).then(() => {
      this.log('Device on position');
    });
  }

  async getDeviceValues(url = `shade/${this.data.relativeIdx}`) {
    return super.getDeviceValues(url)
      .then((data) => {
        this.setCapabilityValue('windowcoverings_set', (100 - data.target.blind) / 100);
        return data;
      })
      .catch((err) => {
        this.error(`getDeviceValues() > ${err}`);
        this.showWarning(err.message);
      });
  }

  async onCapabilityWindowCoveringsSet(value, opts) {
    const current = this.getCapabilityValue('windowcoverings_set');
    if (current === value) return Promise.resolve();

    this.debug(`onCapabilityWindowCoveringsSet() - ${current} > ${value}`);
    const deviceData = await this.getDeviceData(`shade/${this.data.relativeIdx}`);
    const covering = Math.round(100 - value * 100);
    const { lamella } = deviceData.target;

    return this.setDeviceData(`shade/${this.data.relativeIdx}?blind=${covering}&lamella=${lamella}`)
      .then(await this.waitForPosition())
      .catch((err) => this.error(`onCapabilityWindowCoveringsSet() > ${err}`));
  }

};
