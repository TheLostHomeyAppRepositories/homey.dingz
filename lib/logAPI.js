'use strict';

/* eslint-disable func-names */

const Homey = require('homey');

const logList = [];
const { log } = Homey.SimpleClass.prototype;

function writeLog(type, instance, ...args) {
  if (instance && instance.homey) {
    let entry = `[${type}] `;

    const tz = instance.homey.clock.getTimezone();
    const nowTime = new Date();
    const now = nowTime.toLocaleString('en-US',
      {
        hour12: false,
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    let date = now.split(', ')[0];
    date = `${date.split('/')[2]}-${date.split('/')[0]}-${date.split('/')[1]}`;
    const time = now.split(', ')[1];
    entry += `${date} ${time}:`;
    entry += nowTime.getSeconds();

    if (instance instanceof Homey.App) {
      entry += ' [APP] ';
    }
    if (instance instanceof Homey.Driver) {
      entry += ` [Driver:${instance.id}] `;
      if (args[0].startsWith('[Device:')) {
        return;
      }
    }
    if (instance instanceof Homey.Device) {
      entry += ` [Device:${instance.getName()}] `;
    }

    entry += args;
    logList.unshift(entry);
    if (logList.length > 50) {
      logList.pop();
    }
  }
}

Homey.SimpleClass.prototype.log = function(...args) {
  writeLog('log', this, ...args);
  log.apply(this, args);
};
const { err } = Homey.SimpleClass.prototype;
Homey.SimpleClass.prototype.err = function(...args) {
  writeLog('err', this, ...args);
  err.apply(this, args);
};
