const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    // 1. Grouped by StatusCode
    const resGrouped = await pool.request().query(`
      SELECT 
        StatusCode,
        COUNT(*) as Cnt,
        SUM(Quantity) as SumQty,
        SUM(TotalDetailLineAmount) as SumAmount
      FROM (
        SELECT StatusCode, Quantity, TotalDetailLineAmount, OrderDateTime, OrderId FROM dbo.RestaurantOrderDetail WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT StatusCode, Quantity, TotalDetailLineAmount, OrderDateTime, OrderId FROM dbo.RestaurantOrderDetailCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      ) t
      WHERE CAST(OrderDateTime AS DATE) BETWEEN '${start}' AND '${end}'
      GROUP BY StatusCode
    `);
    console.log("Grouped by Detail StatusCode:");
    console.table(resGrouped.recordset);

    // 2. Let's check status codes of RestaurantOrder/Cur (the headers) as well
    const resHeaders = await pool.request().query(`
      SELECT 
        StatusCode,
        COUNT(*) as Cnt,
        SUM(TotalAmountLessFreight) as SumAmountLessFreight
      FROM (
        SELECT StatusCode, TotalAmountLessFreight, OrderDateTime, OrderId FROM dbo.RestaurantOrder WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT StatusCode, TotalAmountLessFreight, OrderDateTime, OrderId FROM dbo.RestaurantOrderCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      ) t
      WHERE CAST(OrderDateTime AS DATE) BETWEEN '${start}' AND '${end}'
      GROUP BY StatusCode
    `);
    console.log("Grouped by Header StatusCode:");
    console.table(resHeaders.recordset);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
