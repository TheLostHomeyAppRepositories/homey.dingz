'use strict';

module.exports = {
  async dingzGenActionAPI({ homey, query }) {
    return homey.app.dingzGenActionAPI(query);
  },
};
