require("dotenv").config();
const sql = require("mssql");

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_DATABASE,

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