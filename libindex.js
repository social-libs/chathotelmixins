function createLib (execlib, chatclientlib, vararglib) {
  'use strict';

  return {
    mixins: {
      service: require('./servicecreator')(execlib, chatclientlib, vararglib)
    }
  };
}

module.exports = createLib;
