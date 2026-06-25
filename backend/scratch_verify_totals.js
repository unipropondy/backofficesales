const { poolPromise } = require("./db");
const { getReportQuery } = require("./routes/salesreportRoutes.js"); // Wait, does salesreportRoutes.js export getReportQuery? Let's check.
// Actually, let's just write the SQL directly here to check the sum of Itemwise or Group.

async function verify() {
  try {
    const pool = await poolPromise;
    const fromDate = '2026-05-01';
    const toDate = '2026-06-25';

    console.log("Checking Itemwise sales totals between 2026-05-01 and 2026-06-25:");
    const query = `
      SELECT 
        SUM(rd.Quantity) AS Qty, 
        SUM(rd.TotalDetailLineAmount) AS Amount
      FROM dbo.RestaurantOrderDetail rd
      JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
      JOIN dbo.RestaurantInvoice ri ON rd.OrderId = ri.OrderId
      LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
      LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
      WHERE 1=1
        AND ri.OrderDateTime >= '${fromDate}'  
        AND ri.OrderDateTime < '${toDate} 23:59:59'
        AND ri.OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
    `;
    const res = await pool.request().query(query);
    console.log("With filter:", res.recordset[0]);

    const queryWithout = `
      SELECT 
        SUM(rd.Quantity) AS Qty, 
        SUM(rd.TotalDetailLineAmount) AS Amount
      FROM dbo.RestaurantOrderDetail rd
      JOIN dbo.DishMaster dm ON rd.DishId = dm.DishId
      JOIN dbo.RestaurantInvoice ri ON rd.OrderId = ri.OrderId
      LEFT JOIN dbo.DishGroupMaster dgm ON dm.DishGroupId = dgm.DishGroupId
      LEFT JOIN dbo.CategoryMaster cm ON dgm.CategoryId = cm.CategoryId
      WHERE 1=1
        AND ri.OrderDateTime >= '${fromDate}'  
        AND ri.OrderDateTime < '${toDate} 23:59:59'
    `;
    const resWithout = await pool.request().query(queryWithout);
    console.log("Without filter:", resWithout.recordset[0]);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

verify();
