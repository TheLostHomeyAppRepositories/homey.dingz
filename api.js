"use strict";

const Homey = require("homey");

// TODO:
// const apiAuthorizationPublic = !(Homey.ManagerSettings.get('httpSettings') === null ? true : Homey.ManagerSettings.get('httpSettings').apiAuthorization)
const apiAuthorizationPublic = true;

module.exports = [
  {
    description: "dingz-device generic action",
    method: "GET",
    path: "/dingzGenAction",
    public: apiAuthorizationPublic,
    fn: (args, callback) => {
      const result = Homey.emit("dingzGenAction", args.query);
      if (result instanceof Error) return callback(result);
      return callback(null, result);
    },
  },
  {
    description: "dingz-device generic pir action",
    method: "GET",
    path: "/dingzPirGenAction",
    public: apiAuthorizationPublic,
    fn: (args, callback) => {
      const result = Homey.emit("dingzPirGenAction", args.query);
      if (result instanceof Error) return callback(result);
      return callback(null, result);
    },
  },
  {
    description: "dingz-device generic button action",
    method: "GET",
    path: "/dingzButtonGenAction",
    public: apiAuthorizationPublic,
    fn: (args, callback) => {
      const result = Homey.emit("dingzButtonGenAction", args.query);
      if (result instanceof Error) return callback(result);
      return callback(null, result);
    },
  },
  {
    description: "dingz-device generic switch action",
    method: "GET",
    path: "/dingzSwitchGenAction",
    public: apiAuthorizationPublic,
    fn: (args, callback) => {
      const result = Homey.emit("dingzSwitchGenAction", args.query);
      if (result instanceof Error) return callback(result);
      return callback(null, result);
    },
  },
  {
    description: "dingz-device generic light action",
    method: "GET",
    path: "/dingzLightGenAction",
    public: apiAuthorizationPublic,
    fn: (args, callback) => {
      const result = Homey.emit("dingzDimmerGenAction", args.query);
      if (result instanceof Error) return callback(result);
      return callback(null, result);
    },
  },
  {
    description: "dingz-device generic shade action",
    method: "GET",
    path: "/dingzShadeGenAction",
    public: apiAuthorizationPublic,
    fn: (args, callback) => {
      const result = Homey.emit("dingzShadeGenAction", args.query);
      if (result instanceof Error) return callback(result);
      return callback(null, result);
    },
  },
  {
    description: "dingz-device generic blind action",
    method: "GET",
    path: "/dingzBlindGenAction",
    public: apiAuthorizationPublic,
    fn: (args, callback) => {
      const result = Homey.emit("dingzBlindGenAction", args.query);
      if (result instanceof Error) return callback(result);
      return callback(null, result);
    },
  },
];
