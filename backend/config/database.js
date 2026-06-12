require("dotenv").config();
const sql = require("mssql");

const dbConfig = {
  user: process.env.DB_USER || "ups",
  password: process.env.DB_PASSWORD || "ups",
  server: process.env.DB_SERVER || "myerpcloud.dyndns.org",
  port: parseInt(process.env.DB_PORT || "9199"),
  database: process.env.DB_NAME || process.env.DB_DATABASE || "UCS",

  options: {
    encrypt: false,
    enableArithAbort: true,
    trustServerCertificate: true
  },

  connectionTimeout: 30000,
  requestTimeout: 30000
};

const poolPromise = sql.connect(dbConfig)
  .then(pool => {
    console.log("✅ Connected to MSSQL (Global Pool)");
    return pool;
  })
  .catch(err => {
    console.error("❌ DB Connection Error Details:");
    console.error(err);
  });

module.exports = { sql, poolPromise };
