const { poolPromise } = require('./db');

async function checkSchema() {
  try {
    const pool = await poolPromise;
    console.log("--- TABLE LIST ---");
    const tablesRes = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES");
    console.log(tablesRes.recordset.map(t => t.TABLE_NAME).join(', '));

    const targets = ['BusinessUnit', 'MasterSettings', 'Organization']; // Common names
    for (const table of targets) {
        console.log(`\n--- SCHEMA FOR ${table} ---`);
        const columnsRes = await pool.request().query(`SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table}'`);
        if (columnsRes.recordset.length === 0) {
            console.log(`Table ${table} not found or empty.`);
        } else {
            console.log(JSON.stringify(columnsRes.recordset, null, 2));
        }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
