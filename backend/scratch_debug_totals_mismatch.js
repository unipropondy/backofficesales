const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const fromDate = '2026-05-01';
    const toDate = '2026-06-25';

    console.log("=== Checking Monthwise/Qty Reports ===");
    const resMonth = await pool.request().query(`
      SELECT 
        SUM(vw.TotalDetailLineAmount) AS Amount
      FROM dbo.Vw_MonthwiseSales vw
      WHERE vw.OrderDateTime >= '${fromDate}' 
        AND vw.OrderDateTime <= '${toDate} 23:59:59'
        AND vw.OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
    `);
    console.log("Vw_MonthwiseSales sum:", resMonth.recordset[0]);

    console.log("=== Checking Category Report ===");
    const resCategory = await pool.request().query(`
      SELECT 
        SUM(ISNULL(TRY_CAST(rd.Quantity AS DECIMAL(25,2)), 0)) AS Sold,
        SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS NetSales
      FROM dbo.RestaurantInvoice ri
      INNER JOIN dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
      WHERE ri.InvoiceDate >= '${fromDate} 00:00:00'
        AND ri.InvoiceDate <= '${toDate} 23:59:59'
        AND ri.OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
    `);
    console.log("Category report sum:", resCategory.recordset[0]);

    console.log("=== Checking DishGroup Report ===");
    const resDishGroup = await pool.request().query(`
      SELECT 
        SUM(ISNULL(TRY_CAST(rd.Quantity AS DECIMAL(25,2)), 0)) AS Sold,
        SUM(ISNULL(TRY_CAST(rd.TotalDetailLineAmount AS DECIMAL(25,2)), 0)) AS NetSales
      FROM dbo.RestaurantInvoice ri
      INNER JOIN dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
      WHERE ri.InvoiceDate >= '${fromDate} 00:00:00'
        AND ri.InvoiceDate <= '${toDate} 23:59:59'
        AND ri.OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
    `);
    console.log("DishGroup report sum:", resDishGroup.recordset[0]);

    console.log("=== Checking Itemwise Report ===");
    const resItemwise = await pool.request().query(`
      SELECT 
        SUM(rd.Quantity) AS Qty, 
        SUM(rd.TotalDetailLineAmount) AS Amount
      FROM dbo.RestaurantOrderDetail rd
      JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
      JOIN dbo.RestaurantInvoice ri ON rd.OrderId = ri.OrderId
      WHERE 1=1
        AND ri.OrderDateTime >= '${fromDate}'  
        AND ri.OrderDateTime < '${toDate} 23:59:59'
        AND ri.OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
    `);
    console.log("Itemwise report sum:", resItemwise.recordset[0]);

    console.log("=== Checking Daywise Report ===");
    const resDaywise = await pool.request().query(`
      SELECT 
        SUM(CAST(rd.Quantity AS DECIMAL(18,2))) AS Qty,
        SUM(CAST(rd.TotalDetailLineAmount AS DECIMAL(18,2))) AS Amount
      FROM dbo.RestaurantInvoice ri
      JOIN dbo.RestaurantOrderDetail rd ON ri.OrderId = rd.OrderId
      WHERE 1=1
        AND ri.OrderDateTime >= '${fromDate}'  
        AND ri.OrderDateTime < '${toDate} 23:59:59'
        AND ri.OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
    `);
    console.log("Daywise report sum:", resDaywise.recordset[0]);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
