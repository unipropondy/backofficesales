const { poolPromise } = require('./db');

async function check() {
    try {
        const pool = await poolPromise;
        
        console.log('=== RestaurantInvoice daily totals by InvoiceDate ===');
        const res = await pool.request().query(`
            SELECT CAST(InvoiceDate AS DATE) as Date, 
                   COUNT(*) as BillCount,
                   SUM(TotalLineItemAmount) as GrossSales,
                   SUM(TotalDiscountAmount) as TotalDiscount,
                   SUM(ServiceCharge) as ServiceCharge,
                   SUM(TotalTax) as TotalTax,
                   SUM(RoundedBy) as Rounding,
                   SUM(TotalAmount) as NetSales
            FROM RestaurantInvoice 
            GROUP BY CAST(InvoiceDate AS DATE) 
            ORDER BY Date DESC
        `);
        
        res.recordset.forEach(r => {
            console.log(`Date: ${r.Date?.toISOString()?.split('T')[0]}, Bills: ${r.BillCount}, Gross: ${r.GrossSales?.toFixed(2)}, Discount: ${r.TotalDiscount?.toFixed(2)}, NetSales: ${r.NetSales?.toFixed(2)}, Rounding: ${r.Rounding?.toFixed(2)}`);
        });

        console.log('\n=== RestaurantInvoice daily totals by OrderDateTime ===');
        const res2 = await pool.request().query(`
            SELECT CAST(OrderDateTime AS DATE) as Date, 
                   COUNT(*) as BillCount,
                   SUM(TotalLineItemAmount) as GrossSales,
                   SUM(TotalAmount) as NetSales,
                   SUM(RoundedBy) as Rounding
            FROM RestaurantInvoice 
            GROUP BY CAST(OrderDateTime AS DATE) 
            ORDER BY Date DESC
        `);
        
        res2.recordset.forEach(r => {
            console.log(`OrderDate: ${r.Date?.toISOString()?.split('T')[0]}, Bills: ${r.BillCount}, Gross: ${r.GrossSales?.toFixed(2)}, Net: ${r.NetSales?.toFixed(2)}, Rounding: ${r.Rounding?.toFixed(2)}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

check();
