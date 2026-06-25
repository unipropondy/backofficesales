const { poolPromise } = require("../db");

async function run() {
  try {
    const pool = await poolPromise;
    const res = await pool.request().query(`
      SELECT definition 
      FROM sys.sql_modules 
      WHERE object_id = OBJECT_ID('dbo.Vw_DishwiseSales')
    `);
    if (res.recordset.length > 0) {
      console.log(res.recordset[0].definition);
    } else {
      console.log("vw_NItemSalesReport NOT FOUND");
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
