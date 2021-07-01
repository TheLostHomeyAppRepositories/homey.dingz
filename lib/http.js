"use strict";

const Homey = require("homey");
const Axios = require("axios");

module.exports = class Api {
  constructor(baseUrl = "") {
    // this.axios = Axios.create(config);
    this.axios = Axios.default;
    this.axios.defaults.baseURL = baseUrl;
  }

  get(url, config = {}) {
    this.debug(`get() -> '${url}', config: ${JSON.stringify(config)}`);

    return this.axios
      .get(url, config)
      .then((response) => {
        this.debug(`get() <- '${url}'::${JSON.stringify(response.data || "-")}`);
        return response.data;
      })
      .catch((err) => {
        this.error(`get() > '${url}' - ${err}`);
        throw Error(`http-api get error (${err.response.status})`);
      });
  }

  post(url, data, config = {}) {
    this.debug(`post() -> '${url}'::${JSON.stringify(data || "-")}, config: ${JSON.stringify(config)}`);

    if (data !== null) {
      switch (typeof data) {
        case "string":
          config.headers = { "Content-Type": "text/plain" };
          break;
        case "object":
          config.headers = { "Content-Type": "application/json" };
          break;
        default:
      }
    }

    return this.axios
      .post(url, data, config)
      .then((response) => {
        this.debug(`post() <- '${url}'::${JSON.stringify(response.data || "-")}`);
        return response.data;
      })
      .catch((err) => {
        this.error(`post() > '${url}' - ${err}`);
        throw Error(`http-api post error (${err.response.status})`);
      });
  }

  put(url, data, config = {}) {
    this.debug(`put() -> '${url}'::${JSON.stringify(data)}, config: ${JSON.stringify(config)}`);
    return this.axios
      .put(url, data, config)
      .then((response) => {
        this.debug(`put() <- '${url}'::${JSON.stringify(response.data || "-")}`);
        return response.data;
      })
      .catch((err) => {
        this.error(`put() > '${url}' - ${err}`);
        throw Error(`http-api put error (${err.response.status})`);
      });
  }

  delete(url, config = {}) {
    this.debug(`delete() -> '${url}'::${JSON.stringify(config)}`);
    return this.axios
      .delete(url, config)
      .then((response) => {
        this.debug(`delete() '${url}' > ${JSON.stringify(response.data) || "-"}`);
        return response.data;
      })
      .catch((err) => {
        this.error(`delete() > '${url}' - ${err}`);
        throw Error(`http-api delete error (${err.response.status})`);
      });
  }

  // Homey-App Loggers
  log(msg) {
    Homey.app.log(`${this._logLinePrefix()} ${msg}`);
  }

  error(msg) {
    Homey.app.error(`${this._logLinePrefix()} ${msg}`);
  }

  debug(msg) {
    // Only for http-api tests
    // Homey.app.debug(`${this._logLinePrefix()} ${msg}`);
  }

  _logLinePrefix() {
    return `Http.api >`;
  }
};
