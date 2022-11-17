'use strict';

module.exports = {
  async dingzBroadcastAPI({ homey, query }) {
    return homey.app.dingzBroadcastAPI(query);
  },
};
