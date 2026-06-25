const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const views = [
      'vw_RestaurantInvoiceForDishwiseSales',
      'vw_RestaurantInvoiceForDishwiseSalesCur'
    ];

    for (let viewName of views) {
      const res = await pool.request().query(`
        SELECT definition 
        FROM sys.sql_modules 
        WHERE object_id = OBJECT_ID('dbo.${viewName}')
      `);
      if (res.recordset.length > 0) {
        console.log(`\n========================================`);
        console.log(`View Definition of dbo.${viewName}:`);
        console.log(`========================================`);
        console.log(res.recordset[0].definition);
      } else {
        console.log(`\nView ${viewName} not found in sys.sql_modules`);
      }
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
