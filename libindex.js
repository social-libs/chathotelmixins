function createLib (execlib, chatclientlib) {
  'use strict';

  return {
    mixins: {
      service: require('./servicecreator')(execlib, chatclientlib)
    }
  };
}

module.exports = createLib;
