const { poolPromise } = require('./db');

async function checkHappyHoursSchema() {
  try {
    const pool = await poolPromise;
    console.log(`\n--- SCHEMA FOR HappyHours ---`);
    const columnsRes = await pool.request().query(`SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'HappyHours'`);
    if (columnsRes.recordset.length === 0) {
        console.log(`Table HappyHours not found or empty.`);
    } else {
        console.log(JSON.stringify(columnsRes.recordset, null, 2));
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkHappyHoursSchema();
