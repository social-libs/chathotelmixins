function createLib (execlib) {
  return execlib.loadDependencies('client', ['social:chatclient:lib', 'allex:varargfunctionhandler:lib'], require('./libindex').bind(null, execlib));
}

module.exports = createLib;
