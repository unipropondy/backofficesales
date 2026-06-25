const { poolPromise } = require("./db");

async function refreshViews() {
    try {
        const pool = await poolPromise;
        
        console.log("Refreshing view vw_PaymentDetail...");
        await pool.request().query("EXEC sp_refreshview 'dbo.vw_PaymentDetail'");
        
        console.log("Refreshing view vw_PaymentDetailCur...");
        await pool.request().query("EXEC sp_refreshview 'dbo.vw_PaymentDetailCur'");
        
        console.log("Refreshing view vw_RestaurantOrderDetail...");
        await pool.request().query("EXEC sp_refreshview 'dbo.vw_RestaurantOrderDetail'");
        
        console.log("Refreshing view vw_RestaurantOrderDetailCur...");
        await pool.request().query("EXEC sp_refreshview 'dbo.vw_RestaurantOrderDetailCur'");

        console.log("Views refreshed successfully!");
        process.exit(0);
    } catch(e) {
        console.error("Refresh failed:", e.message);
        process.exit(1);
    }
}

refreshViews();
