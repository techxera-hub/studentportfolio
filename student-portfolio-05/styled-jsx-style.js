// Shim for styled-jsx/style default export
const { style } = require('styled-jsx/dist/index');
module.exports = style;
module.exports.default = style;

