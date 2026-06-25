const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    // 1. Group Sales sum
    const resGroup = await pool.request().query(`
      SELECT 
        SUM(rd.Quantity) AS Qty,
        SUM(rd.TotalDetailLineAmount) AS Amount
      FROM dbo.RestaurantOrderDetail rd
      JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
      JOIN dbo.RestaurantInvoice ri ON rd.OrderId = ri.OrderId
      WHERE ri.OrderDateTime >= '${start}'  
        AND ri.OrderDateTime <= '${end} 23:59:59'
        AND ri.OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
    `);
    console.log("Group/Itemwise sum (RestaurantOrderDetail + RestaurantInvoice JOIN):", resGroup.recordset[0]);

    // 2. Daywise sum
    const resDaywise = await pool.request().query(`
      SELECT 
        SUM(rd.Quantity) AS Qty,
        SUM(rd.TotalDetailLineAmount) AS Amount
      FROM dbo.RestaurantInvoice ri
      JOIN dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
      WHERE ri.OrderDateTime >= '${start}'  
        AND ri.OrderDateTime < '${end} 23:59:59'
        AND ri.OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
    `);
    console.log("Daywise sum:", resDaywise.recordset[0]);

    // 3. Hourly sum
    const resHourly = await pool.request().query(`
      SELECT 
        SUM(rd.TotalDetailLineAmount) AS Amount
      FROM dbo.RestaurantInvoice ri
      INNER JOIN dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
      WHERE ri.OrderDateTime >= '${start}'  
        AND ri.OrderDateTime < '${end} 23:59:59'
        AND ri.OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
    `);
    console.log("Hourly sum:", resHourly.recordset[0]);

    // 4. Raw RestaurantOrderDetail sum without joining RestaurantInvoice
    const resRawDetails = await pool.request().query(`
      SELECT 
        SUM(Quantity) AS Qty,
        SUM(TotalDetailLineAmount) AS Amount
      FROM dbo.RestaurantOrderDetail
      WHERE OrderDateTime >= '${start}'  
        AND OrderDateTime <= '${end} 23:59:59'
        AND OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
    `);
    console.log("Raw RestaurantOrderDetail (no join):", resRawDetails.recordset[0]);

    // 5. Let's find what dates give Qty = 9466.00 or Amount = 166028.24
    // We will search for all dates in June 2026 to see if there is any date range matching.
    const resSearch = await pool.request().query(`
      SELECT 
        CAST(OrderDateTime AS DATE) AS Date,
        SUM(Quantity) AS Qty,
        SUM(TotalDetailLineAmount) AS Amount
      FROM dbo.RestaurantOrderDetail
      WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      GROUP BY CAST(OrderDateTime AS DATE)
      ORDER BY Date
    `);
    console.log("Daily totals in RestaurantOrderDetail:");
    console.table(resSearch.recordset);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
