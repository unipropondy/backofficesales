const { poolPromise } = require("../db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    const res = await pool.request().query(`
      SELECT 
        rd.StatusCode,
        PLM.PickListValue,
        COUNT(*) as cnt,
        SUM(rd.Quantity) as SumQty,
        SUM(rd.TotalDetailLineAmount) as SumAmount
      FROM (
        SELECT OrderId, StatusCode, Quantity, TotalDetailLineAmount FROM dbo.RestaurantOrderDetail WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT OrderId, StatusCode, Quantity, TotalDetailLineAmount FROM dbo.RestaurantOrderDetailCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      ) rd
      INNER JOIN (
        SELECT OrderId, MIN(InvoiceDate) AS InvoiceDate
        FROM (
          SELECT OrderId, InvoiceDate FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
          UNION ALL
          SELECT OrderId, InvoiceDate FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        ) ri_all
        GROUP BY OrderId
      ) ri ON rd.OrderId = ri.OrderId
      LEFT JOIN dbo.PickListMaster PLM ON rd.StatusCode = PLM.PickListNumber
        AND PLM.TableName = 'RestaurantOrderDetail' AND PLM.FieldName = 'StatusCode'
      WHERE ri.InvoiceDate >= '${start} 00:00:00' AND ri.InvoiceDate <= '${end} 23:59:59'
      GROUP BY rd.StatusCode, PLM.PickListValue
    `);

    console.table(res.recordset);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
