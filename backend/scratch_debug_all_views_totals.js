const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    const start = '2026-06-22';
    const end = '2026-06-23';

    // Get all views
    const resViews = await pool.request().query(`
      SELECT name 
      FROM sys.views 
      WHERE schema_id = SCHEMA_ID('dbo')
    `);

    const views = resViews.recordset;
    console.log(`Found ${views.length} views to check...`);

    for (let view of views) {
      try {
        // We will try to query the view for Qty and Amount.
        // We'll dynamically look at columns of the view first to find which columns represent date, quantity, and amount.
        const colsRes = await pool.request().query(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = '${view.name}'
        `);
        const cols = colsRes.recordset.map(c => c.COLUMN_NAME.toLowerCase());

        // Find date column candidate
        let dateCol = null;
        if (cols.includes('orderdatetime')) dateCol = 'OrderDateTime';
        else if (cols.includes('invoicedate')) dateCol = 'InvoiceDate';
        else if (cols.includes('createdon')) dateCol = 'CreatedOn';
        else if (cols.includes('lastdayenddate')) dateCol = 'LastDayEndDate';
        else if (cols.includes('transactiondate')) dateCol = 'TransactionDate';

        // Find quantity column candidate
        let qtyCol = null;
        if (cols.includes('quantity')) qtyCol = 'Quantity';
        else if (cols.includes('qty')) qtyCol = 'qty';
        else if (cols.includes('soldqty')) qtyCol = 'SoldQty';
        else if (cols.includes('sold')) qtyCol = 'Sold';

        // Find amount column candidate
        let amtCol = null;
        if (cols.includes('totaldetaillineamount')) amtCol = 'TotalDetailLineAmount';
        else if (cols.includes('amount')) amtCol = 'Amount';
        else if (cols.includes('revenue')) amtCol = 'Revenue';
        else if (cols.includes('itemsales')) amtCol = 'ItemSales';
        else if (cols.includes('subtotal')) amtCol = 'SubTotal';

        if (dateCol && (qtyCol || amtCol)) {
          const sqlQuery = `
            SELECT 
              SUM(CAST(${qtyCol || '0'} AS DECIMAL(18,2))) as TotalQty,
              SUM(CAST(${amtCol || '0'} AS DECIMAL(18,2))) as TotalAmount
            FROM dbo.${view.name}
            WHERE CAST(${dateCol} AS DATE) BETWEEN '${start}' AND '${end}'
          `;
          const result = await pool.request().query(sqlQuery);
          const row = result.recordset[0];
          const q = Number(row.TotalQty || 0);
          const a = Number(row.TotalAmount || 0);

          if (q > 0 || a > 0) {
            console.log(`View: dbo.${view.name} (DateCol: ${dateCol}, QtyCol: ${qtyCol}, AmtCol: ${amtCol}) => Qty: ${q.toFixed(2)}, Amount: ${a.toFixed(2)}`);
            if (q === 2535 || Math.abs(a - 14525.30) < 0.1) {
              console.log(`  🌟 TARGET MATCH! 🌟`);
            }
          }
        }
      } catch (err) {
        // Skip views that fail due to schema/type issues
      }
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
