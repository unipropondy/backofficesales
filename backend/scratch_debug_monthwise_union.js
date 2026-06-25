const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    // Query Vw_MonthwiseSales (history) unioned with Vw_MonthwiseSales (cur-equivalent)
    // using the exact view definition for current:
    const query = `
      SELECT 
        SUM(Quantity) as TotalQty,
        SUM(TotalDetailLineAmount) as TotalAmount
      FROM (
        -- History from Vw_MonthwiseSales
        SELECT Quantity, TotalDetailLineAmount, OrderDateTime
        FROM dbo.Vw_MonthwiseSales
        
        UNION ALL
        
        -- Current equivalent
        SELECT 
          ROD.Quantity,
          ROD.TotalDetailLineAmount,
          ROD.OrderDateTime
        FROM dbo.RestaurantOrderDetailCur ROD
        INNER JOIN dbo.RestaurantInvoiceCur RO ON RO.OrderId = ROD.OrderId
        INNER JOIN dbo.PickListMaster PLM1 ON RO.StatusCode = PLM1.PickListNumber
        INNER JOIN dbo.DishMaster DM ON DM.DishId = ROD.DishID
        INNER JOIN dbo.DishGroupMaster DGM ON DGM.Dishgroupid = DM.DishGroupId
        WHERE PLM1.TableName = 'RestaurantOrder' 
          AND PLM1.FieldName = 'StatusCode' 
          AND PLM1.PickListValue = 'Paid'
      ) t
      WHERE OrderDateTime >= '${start}' AND OrderDateTime <= '${end} 23:59:59'
    `;

    const res = await pool.request().query(query);
    console.log("Union of Vw_MonthwiseSales history + cur-equivalent:");
    console.table(res.recordset);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
