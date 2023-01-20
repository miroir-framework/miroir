const JSDOMEnvironment = require('jest-environment-jsdom');

/**
 * A custom environment to set the TextEncoder that is required by TensorFlow.js.
 * 
 * does not work: TypeError: Class extends value [object Object] is not a constructor or null
 * WHY ?????????????????????????????????????????????????
 */
module.exports = class CustomTestEnvironment extends JSDOMEnvironment {
  async setup() {
    await super.setup();
    if (typeof this.global.TextEncoder === 'undefined') {
      const { TextEncoder } = require('util');
      this.global.TextEncoder = TextEncoder;
    }
  }
}
