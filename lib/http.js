"use strict";

const { URL } = require("url");
const http = require("http.min");

const Homey = require("homey");

module.exports = class Api {
  constructor(url = "") {
    this.baseURL = url;
  }

  get(url, config = {}) {
    this.debug(`get() -> '${url}' :: ${JSON.stringify(config)}`);
    return Promise.resolve(this.getUrl(url, config))
      .then((options) => http.get(options))
      .then((response) => {
        this.debug(`get() <- '${url}' :: ${response.data}`);
        try {
          return JSON.parse(response.data);
        } catch {
          return response.data;
        }
      })
      .catch((err) => {
        this.error(`get() > ${err}`);
      });
  }

  post(url, data, config = {}) {
    this.debug(`post() -> '${url}' :: ${JSON.stringify(data)}, ${JSON.stringify(config)}`);
    return Promise.resolve(this.getUrl(url, config))
      .then((options) => http.post(options, data))
      .then((response) => {
        this.debug(`post() <- '${url}' :: ${response.data}`);
        try {
          return JSON.parse(response.data);
        } catch {
          return response.data;
        }
      })
      .catch((err) => {
        this.error(`post() > ${err}`);
      });
  }

  put(url, data, config = {}) {
    this.debug(`put() -> '${url}' :: ${JSON.stringify(data)}, ${JSON.stringify(config)}`);
    return Promise.resolve(this.getUrl(url, config))
      .then((options) => http.put(options, data))
      .then((response) => {
        this.debug(`put() <- '${url}' :: ${JSON.stringify(response.data)}`);
        try {
          return JSON.parse(response.data);
        } catch {
          return response.data;
        }
      })
      .catch((err) => {
        this.error(`put() > ${err}`);
      });
  }

  delete(url, config = {}) {
    this.debug(`delete() -> '${url}' :: ${JSON.stringify(config)}`);
    return Promise.resolve(this.getUrl(url, config))
      .then((options) => http.delete(options))
      .then((response) => {
        this.debug(`delete() <- '${url}' :: ${JSON.stringify(response.data)}`);
        try {
          return JSON.parse(response.data);
        } catch {
          return response.data;
        }
      })
      .catch((err) => {
        this.error(`delete() > ${err}`);
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

  // Homey-App Loggers
  log(msg) {
    Homey.app.log(`${this._logLinePrefix()} ${msg}`);
  }

  error(msg) {
    Homey.app.error(`${this._logLinePrefix()} ${msg}`);
  }

  debug(msg) {
    // Homey.app.debug(`${this._logLinePrefix()} ${msg}`);
  }

  _logLinePrefix() {
    return `Http.api >`;
  }
};
