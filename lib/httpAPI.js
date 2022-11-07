'use strict';

const Axios = require('axios');

module.exports = class HttpAPI {

  constructor(homey, name = '###') {
    this.homey = homey;
    this.name = name;

    this.axios = Axios.create();
    this._initInterceptors();

    this.debug('Initialized');
  }

  getName() {
    return this.name;
  }

  get(url, config = {}) {
    return this.axios.get(url, config)
      .then((response) => response.data);
  }

  post(url, data, config = {}) {
    if (data !== null) {
      switch (typeof data) {
        case 'string':
          config.headers = { 'Content-Type': 'text/plain' };
          break;
        case 'object':
          config.headers = { 'Content-Type': 'application/json' };
          break;
        default:
      }
    }
    return this.axios.post(url, data, config)
      .then((response) => response.data);
  }

  put(url, data, config = {}) {
    return this.axios.put(url, data, config)
      .then((response) => response.data);
  }

  delete(url, config = {}) {
    return this.axios.delete(url, config)
      .then((response) => response.data);
  }

  _initInterceptors() {
    // this.debug("_initInterceptors()");
    this.axios.interceptors.request.use(
      (config) => {
        if (config._callOnce) return config;
        config._callOnce = true;

        const msgPrefix = `${config.method.toUpperCase()} -> '${config.url}'`;
        this.debug(`${msgPrefix} ${config.data ? `- ${JSON.stringify(config.data)}` : ''}`);
        return config;
      },
      (error) => {
        if (error._callOnce) return Promise.reject(error);
        error._callOnce = true;

        const msgPrefix = `${error.request.method.toUpperCase()} '${error.request.url}' > `;
        this.error(`${msgPrefix} ${error.message}`);

        // Show the error only in the debug mode.
        if (process.env.DEBUG === '1') {
          this.error(`${msgPrefix} > ${error.request}`);
        }
        return Promise.reject(error);
      },
    );

    this.axios.interceptors.response.use(
      (response) => {
        if (response._callOnce) return response;
        response._callOnce = true;

        const msgPrefix = `${response.config.method.toUpperCase()} <- '${response.config.url}'`;
        this.debug(`${msgPrefix} ${response.data ? `- ${JSON.stringify(response.data)}` : ''}`);

        return response;
      },
      (error) => {
        if (error._callOnce) return Promise.reject(error);
        error._callOnce = true;

        const statusCode = error.response ? error.response.status : null;
        const msgPrefix = `${error.config.method.toUpperCase()} '${error.config.url}' > `;
        this.error(`${msgPrefix} ${error.message}`);

        // Show the error only in the debug mode.
        if (process.env.DEBUG === '1') {
          this.error(`${msgPrefix} url: ${error.config.baseURL.concat(error.config.url)}`);
          this.error(`${msgPrefix} status: ${statusCode}`);
          this.error(`${msgPrefix} data: ${error.response.data}`);
          this.error(`${msgPrefix} headers: ${JSON.stringify(error.response.headers)}`);
        }

        switch (statusCode) {
          case 401:
            // utils.redirectTo("/login")
            break;
          case 404:
            // return Promise.reject(Error(`${error.config.url} not found`));
            break;
          default:
            break;
        }

        return Promise.reject(error);
      },
    );
  }

  // Homey-App Loggers
  log(msg) {
    this.homey.app.log(`${this._logLinePrefix()}-${msg}`);
  }

  error(msg) {
    this.homey.app.error(`${this._logLinePrefix()}-${msg}`);
  }

  debug(msg) {
    // Only for http-api tests
    this.homey.app.debug(`${this._logLinePrefix()}-${msg}`);
  }

  _logLinePrefix() {
    return `${this.getName()} > HttpAPI`;
  }

};
