"use strict";

const { URL } = require("url");
const http = require("http.min");

const Homey = require("homey");

module.exports = class Api {
  constructor(url = "") {
    this.baseURL = url;
  }

  get(url, config = {}) {
    this.debug(`get() -> '${url}', ${JSON.stringify(config)}`);
    return Promise.resolve(this.getUrl(url, config))
      .then((options) => http.get(options))
      .then((response) => {
        const responseData = this.convertResponseData(response.data);
        this.debug(`get() <- '${url}' :: ${JSON.stringify(responseData)}`);
        return responseData;
      })
      .catch((err) => {
        this.error(`get() > '${url}' :: ${err}`);
      });
  }

  post(url, data = "", config = {}) {
    this.debug(`post() -> '${url}' :: ${JSON.stringify(data)}, ${JSON.stringify(config)}`);
    return Promise.resolve(this.getUrl(url, config))
      .then((options) => http.post(options, data))
      .then((response) => {
        const responseData = this.convertResponseData(response.data);
        this.debug(`post() <- '${url}' :: ${JSON.stringify(responseData)}`);
        return responseData;
      })
      .catch((err) => {
        this.error(`post() > '${url}' :: ${err}`);
      });
  }

  put(url, data, config = {}) {
    this.debug(`put() -> '${url}' :: ${JSON.stringify(data)}, ${JSON.stringify(config)}`);
    return Promise.resolve(this.getUrl(url, config))
      .then((options) => http.put(options, data))
      .then((response) => {
        const responseData = this.convertResponseData(response.data);
        this.debug(`put() <- '${url}' :: ${JSON.stringify(responseData)}`);
        return responseData;
      })
      .catch((err) => {
        this.error(`put() > '${url}' :: ${err}`);
      });
  }

  delete(url, config = {}) {
    this.debug(`delete() -> '${url}' :: ${JSON.stringify(config)}`);
    return Promise.resolve(this.getUrl(url, config))
      .then((options) => http.delete(options))
      .then((response) => {
        const responseData = this.convertResponseData(response.data);
        this.debug(`delete() <- '${url}' :: ${JSON.stringify(responseData)}`);
        return responseData;
      })
      .catch((err) => {
        this.error(`delete() > '${url}' :: ${err}`);
      });
  }

  getUrl(input, options = {}) {
    const url = input.includes("://") ? new URL(input) : new URL(input, this.baseURL);
    // ToDo: merge options with URL object
    // eslint-disable-next-line no-restricted-syntax
    // for (const key in options) {
    // >> Always false
    //   if (Object.prototype.hasOwnProperty.call(url, key)) {
    //     url[key] = options[key];
    //   }
    // }
    return url;
  }

  convertResponseData(data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return data;
    }
  }

  // Homey-App Loggers
  log(msg) {
    Homey.app.log(`${this._logLinePrefix()} ${msg}`);
  }

  error(msg) {
    Homey.app.error(`${this._logLinePrefix()} ${msg}`);
  }

  debug(msg) {
    Homey.app.debug(`${this._logLinePrefix()} ${msg}`);
  }

  _logLinePrefix() {
    return `Http.api >`;
  }
};
