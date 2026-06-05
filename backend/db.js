// Wrapper for backwards compatibility with existing route imports.
// All actual config and pool connection logic lives in ./config/database.js
const { sql, poolPromise } = require("./config/database");
module.exports = { sql, poolPromise };