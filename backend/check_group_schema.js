const { poolPromise } = require('./db');

async function checkGroupSchema() {
  try {
    const pool = await poolPromise;
    console.log(`\n--- SCHEMA FOR DishGroupMaster ---`);
    const columnsRes = await pool.request().query(`SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'DishGroupMaster'`);
    console.log(JSON.stringify(columnsRes.recordset, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkGroupSchema();
