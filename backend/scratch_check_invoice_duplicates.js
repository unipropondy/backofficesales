const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    console.log("Checking if OrderId is unique in RestaurantInvoice...");
    const res = await pool.request().query(`
      SELECT OrderId, COUNT(*) as cnt
      FROM dbo.RestaurantInvoice
      GROUP BY OrderId
      HAVING COUNT(*) > 1
    `);
    console.log("Duplicate OrderId in RestaurantInvoice:", res.recordset.length, "rows");
    if (res.recordset.length > 0) {
      console.log("Sample duplicates:", res.recordset.slice(0, 5));
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
