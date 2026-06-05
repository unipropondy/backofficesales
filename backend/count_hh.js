const { poolPromise } = require('./db');

async function countHappyHours() {
  try {
    const pool = await poolPromise;
    const res = await pool.request().query("SELECT COUNT(*) as count FROM HappyHours");
    console.log(`Total rows in HappyHours: ${res.recordset[0].count}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

countHappyHours();
