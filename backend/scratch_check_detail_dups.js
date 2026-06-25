const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    // Count how many OrderIds exist in both RestaurantOrderDetail and RestaurantOrderDetailCur for the range
    const res = await pool.request().query(`
      SELECT 
        (SELECT COUNT(DISTINCT OrderId) FROM dbo.RestaurantOrderDetail WHERE CAST(OrderDateTime AS DATE) BETWEEN '${start}' AND '${end}') as HistDetailOrders,
        (SELECT COUNT(DISTINCT OrderId) FROM dbo.RestaurantOrderDetailCur WHERE CAST(OrderDateTime AS DATE) BETWEEN '${start}' AND '${end}') as CurDetailOrders,
        (
          SELECT COUNT(DISTINCT cur.OrderId)
          FROM dbo.RestaurantOrderDetailCur cur
          WHERE CAST(cur.OrderDateTime AS DATE) BETWEEN '${start}' AND '${end}'
            AND cur.OrderId IN (SELECT OrderId FROM dbo.RestaurantOrderDetail)
        ) as OverlappingOrders
    `);

    console.log("Detail table order overlap counts:");
    console.table(res.recordset);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
