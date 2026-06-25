const { poolPromise } = require("../db");

async function run() {
  try {
    const pool = await poolPromise;
    const res = await pool.request().query(`
      SELECT * FROM dbo.PickListMaster 
      WHERE TableName = 'RestaurantOrderDetail'
    `);
    console.table(res.recordset);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
