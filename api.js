'use strict';

module.exports = {
  async dingzSwitchEventAPI({ homey, query }) {
    return homey.app.dingzSwitchEventAPI(query);
  },
};
