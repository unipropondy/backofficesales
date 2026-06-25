const { poolPromise } = require("./db");

async function checkDuplicates() {
    try {
        const pool = await poolPromise;
        const res1 = await pool.request().query(`
            SELECT TOP 5 OrderDetailId, COUNT(*) as Count 
            FROM dbo.Vw_MonthwiseSales 
            GROUP BY OrderDetailId 
            HAVING COUNT(*) > 1
        `);
        console.log("Duplicate OrderDetailId count in Vw_MonthwiseSales:", res1.recordset);

        if (res1.recordset.length > 0) {
            const dupId = res1.recordset[0].OrderDetailId;
            console.log(`\nInspecting duplicate OrderDetailId: ${dupId}`);
            
            const rodRes = await pool.request().query(`
                SELECT * FROM dbo.RestaurantOrderDetail WHERE OrderDetailId = '${dupId}'
            `);
            console.log("\nFrom RestaurantOrderDetail:", rodRes.recordset);

            const roRes = await pool.request().query(`
                SELECT * FROM dbo.vw_RestaurantInvoiceForDishwiseSales WHERE OrderId = '${rodRes.recordset[0].OrderId}'
            `);
            console.log("\nFrom vw_RestaurantInvoiceForDishwiseSales:", roRes.recordset);

            const plmRes = await pool.request().query(`
                SELECT * FROM dbo.PickListMaster 
                WHERE TableName = 'RestaurantOrder' AND FieldName = 'StatusCode' AND PickListNumber = ${roRes.recordset[0].StatusCode}
            `);
            console.log("\nFrom PickListMaster:", plmRes.recordset);
        }
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

checkDuplicates();
