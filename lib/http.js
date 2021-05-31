"use strict";

const Homey = require("homey");
const Axios = require("axios");

module.exports = class Api {
  constructor(baseUrl = "") {
    // this.axios = Axios.create(config);
    this.axios = Axios.default;
    this.axios.defaults.baseURL = baseUrl;

    // Only if the app in debug-mode !!
    if (process.env.DEBUG === "1") {
      this.axios.interceptors.request.use((req) => {
        // this.debug(`(req) ${req.method.toUpperCase()}: ${req.baseURL}${req.url} -> ${JSON.stringify(req.data) || "-"}`)
        return req;
      });
      this.axios.interceptors.response.use(
        (res) => {
          // this.debug(`(res) ${res.request.method.toUpperCase()}: ${res.config.baseURL}${res.config.url} -> ${JSON.stringify(res.data)}`)
          return res;
        },
        (err) => {
          const errMsg = `${err.config.method.toUpperCase()}: ${err.config.baseURL}${err.config.url}`;
          if (err.response) {
            this.error(`${errMsg} response > ${err.response.data.message} (${err.response.status})`);
          } else if (err.request) {
            this.error(`${errMsg} request > ${err.request}`);
          } else {
            this.error(`${errMsg} message > ${err.message} ${err.code}`);
          }
          throw err;
        }
      );
    }
  }

  get(url, config = {}) {
    // this.debug(`get() '${url}' > ${JSON.stringify(config)}`);
    return this.axios.get(url, config).then((response) => {
      // this.debug(`get() '${url}' > ${JSON.stringify(response.data)}`)
      return response.data;
    });
  }

  post(url, data, config = {}) {
    if (typeof data === "object" && data !== null) {
      config.headers = { "Content-Type": "application/json" };
    } else if (typeof data === "string" && data !== null) {
      config.headers = { "Content-Type": "text/plain" };
    }

    // this.debug(`post() '${url}' > ${JSON.stringify(data)}, ${JSON.stringify(config)}`);
    return this.axios.post(url, data, config).then((response) => {
      // this.debug(`post() '${url}' > ${JSON.stringify(response.data)}`)
      return response.data;
    });
  }

  put(url, data, config = {}) {
    // this.debug(`put() '${url}' > ${JSON.stringify(data)}, ${JSON.stringify(config)}`);
    return this.axios.put(url, data, config).then((response) => {
      // this.debug(`put() '${url}' > ${JSON.stringify(response.data)}`)
      return response.data;
    });
  }

  delete(url, config = {}) {
    // this.debug(`delete()'${url}' > ${JSON.stringify(config)}`);
    return this.axios.delete(url, config).then((response) => {
      // this.debug(`delete() '${url}' > ${JSON.stringify(response.data)}`)
      return response.data;
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
    Homey.app.debug(`${this._logLinePrefix()} ${msg}`);
  }

  _logLinePrefix() {
    return `Http.api >`;
  }
};
