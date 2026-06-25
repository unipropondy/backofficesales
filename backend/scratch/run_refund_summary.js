const { poolPromise } = require("../db");

async function checkRefundSummary() {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT 
                RI.BillNumber,
                DM.DishCode,
                DM.Name AS DishName,
                CAST(ROD.Quantity AS DECIMAL(18,2)) AS Quantity,
                CAST(ROD.TotalDetailLineAmount AS DECIMAL(18,2)) AS Amount,
                RI.TotalAmount,
                RI.TotalDiscountAmount,
                RI.ServiceCharge,
                RI.Tips,
                ROD.PricePerUnit,
                ROD.Tax,
                RI.OrderId,
                RI.InvoiceDate
            FROM dbo.RestaurantOrderDetail ROD
            INNER JOIN dbo.RestaurantInvoice RI ON ROD.OrderId = RI.OrderId
            INNER JOIN dbo.DishMaster DM ON ROD.DishId = DM.DishId
            WHERE CAST(RI.InvoiceDate AS DATE) BETWEEN '2026-06-22' AND '2026-06-23'
              AND RI.OrderId != '1CC2777F-8C8E-4902-AAC5-D7D9DD098F8D'
            ORDER BY RI.OrderId;
        `;
        const res = await pool.request().query(query);
        const records = res.recordset || [];
        
        console.log(`=== Query Output (Total Records: ${records.length}) ===`);
        if (records.length > 0) {
            console.log("\nSample Records (First 5):");
            console.table(records.slice(0, 5).map(r => ({
                BillNumber: r.BillNumber,
                DishCode: r.DishCode,
                DishName: r.DishName,
                Quantity: r.Quantity,
                Amount: r.Amount,
                InvoiceDate: r.InvoiceDate.toISOString().split('T')[0]
            })));

            const sumQty = records.reduce((sum, r) => sum + Number(r.Quantity), 0);
            const sumAmt = records.reduce((sum, r) => sum + Number(r.Amount), 0);
            console.log(`\nTotals calculated from these rows:`);
            console.log(`- Total Quantity: ${sumQty.toFixed(2)}`);
            console.log(`- Total Amount: ${sumAmt.toFixed(2)}`);
        } else {
            console.log("No records found.");
        }
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

checkRefundSummary();
