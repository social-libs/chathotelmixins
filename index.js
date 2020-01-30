function createLib (execlib) {
  return execlib.loadDependencies('client', ['social:chatclient:lib'], require('./libindex').bind(null, execlib));
}

module.exports = createLib;
