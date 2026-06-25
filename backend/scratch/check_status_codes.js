const { poolPromise } = require("../db");

async function run() {
  try {
    const pool = await poolPromise;
    const fromDate = '2026-06-22';
    const toDate = '2026-06-23';

    console.log("=== Invoices Status Codes ===");
    const res = await pool.request().query(`
      SELECT ri_all.StatusCode, COUNT(*) as cnt, MIN(PLM1.PickListValue) as StatusValue
      FROM (
        SELECT OrderId, StatusCode, InvoiceDate FROM dbo.RestaurantInvoice WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
        UNION ALL
        SELECT OrderId, StatusCode, InvoiceDate FROM dbo.RestaurantInvoiceCur WHERE OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
      ) ri_all
      LEFT JOIN dbo.PickListMaster PLM1 ON ri_all.StatusCode = PLM1.PickListNumber 
        AND PLM1.TableName = 'RestaurantOrder' AND PLM1.FieldName = 'StatusCode'
      WHERE ri_all.InvoiceDate >= '${fromDate} 00:00:00' AND ri_all.InvoiceDate <= '${toDate} 23:59:59'
      GROUP BY ri_all.StatusCode
    `);
    console.table(res.recordset);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
