// Shim for styled-jsx/style to provide a default export compatible with Next/Vinext runtime
// The actual style function is exported as a named export in styled-jsx. We re-export it as default.
const { style } = require('styled-jsx/dist/index');
module.exports = style;
module.exports.default = style;

