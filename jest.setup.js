// jest.setup.js
/* eslint-disable @typescript-eslint/no-require-imports */

const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, ".env.test"),
});
