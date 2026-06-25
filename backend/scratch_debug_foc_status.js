const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    // Get all items in the date range, ordered by OrderDateTime
    const res = await pool.request().query(`
      SELECT 
        t.OrderId,
        t.StatusCode,
        t.DishId,
        dm.Name as DishName,
        t.Quantity,
        t.TotalDetailLineAmount,
        t.OrderDateTime
      FROM (
        SELECT StatusCode, Quantity, TotalDetailLineAmount, OrderDateTime, OrderId, DishId FROM dbo.RestaurantOrderDetail WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT StatusCode, Quantity, TotalDetailLineAmount, OrderDateTime, OrderId, DishId FROM dbo.RestaurantOrderDetailCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      ) t
      LEFT JOIN dbo.DishMaster dm ON t.DishId = dm.DishId
      WHERE CAST(t.OrderDateTime AS DATE) BETWEEN '${start}' AND '${end}'
      ORDER BY t.TotalDetailLineAmount ASC
    `);

    const rows = res.recordset;
    console.log(`Total details rows in DB: ${rows.length}`);
    
    // Let's filter in JavaScript to understand the different subgroups:
    // 1. TotalDetailLineAmount = 0
    const focRows = rows.filter(r => Number(r.TotalDetailLineAmount) === 0);
    console.log(`\nFOC Rows (Amount = 0): ${focRows.length}`);
    console.table(focRows.slice(0, 20));

    // 2. StatusCode = 2 (inactive/cancelled?)
    const inactiveRows = rows.filter(r => r.StatusCode === 2);
    console.log(`\nInactive/Cancelled Rows (StatusCode = 2): ${inactiveRows.length}`);
    console.table(inactiveRows);

    // 3. Let's see the sum of Qty and Amount when we do different filters:
    // Filter A: rd.TotalDetailLineAmount > 0
    const filterA = rows.filter(r => Number(r.TotalDetailLineAmount) > 0);
    const sumQtyA = filterA.reduce((sum, r) => sum + r.Quantity, 0);
    const sumAmtA = filterA.reduce((sum, r) => sum + Number(r.TotalDetailLineAmount), 0);
    console.log(`\nFilter A (Amount > 0): Qty = ${sumQtyA}, Amount = ${sumAmtA.toFixed(2)}`);

    // Filter B: StatusCode IN (0, 1, 4) - excluding 2
    const filterB = rows.filter(r => r.StatusCode !== 2);
    const sumQtyB = filterB.reduce((sum, r) => sum + r.Quantity, 0);
    const sumAmtB = filterB.reduce((sum, r) => sum + Number(r.TotalDetailLineAmount), 0);
    console.log(`Filter B (StatusCode != 2): Qty = ${sumQtyB}, Amount = ${sumAmtB.toFixed(2)}`);

    // Filter C: StatusCode IN (0, 1, 4) AND Amount > 0
    const filterC = rows.filter(r => r.StatusCode !== 2 && Number(r.TotalDetailLineAmount) > 0);
    const sumQtyC = filterC.reduce((sum, r) => sum + r.Quantity, 0);
    const sumAmtC = filterC.reduce((sum, r) => sum + Number(r.TotalDetailLineAmount), 0);
    console.log(`Filter C (StatusCode != 2 AND Amount > 0): Qty = ${sumQtyC}, Amount = ${sumAmtC.toFixed(2)}`);

    // Filter D: What if we filter StatusCode = 4?
    const filterD = rows.filter(r => r.StatusCode === 4);
    const sumQtyD = filterD.reduce((sum, r) => sum + r.Quantity, 0);
    const sumAmtD = filterD.reduce((sum, r) => sum + Number(r.TotalDetailLineAmount), 0);
    console.log(`Filter D (StatusCode = 4): Qty = ${sumQtyD}, Amount = ${sumAmtD.toFixed(2)}`);

    // Filter E: What if we filter StatusCode != 2 and StatusCode != 0?
    const filterE = rows.filter(r => r.StatusCode !== 2 && r.StatusCode !== 0);
    const sumQtyE = filterE.reduce((sum, r) => sum + r.Quantity, 0);
    const sumAmtE = filterE.reduce((sum, r) => sum + Number(r.TotalDetailLineAmount), 0);
    console.log(`Filter E (StatusCode NOT IN (0, 2)): Qty = ${sumQtyE}, Amount = ${sumAmtE.toFixed(2)}`);

    // Let's check how many unique orders there are
    const uniqueOrders = new Set(rows.map(r => r.OrderId));
    console.log(`\nUnique Orders in range: ${uniqueOrders.size}`);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
