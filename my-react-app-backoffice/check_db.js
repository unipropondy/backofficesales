const { poolPromise } = require("./backend/db");

async function checkColumns() {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT TOP 0 * FROM Organization");
    console.log("Columns in Organization table:");
    console.log(Object.keys(result.recordset.columns));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkColumns();
