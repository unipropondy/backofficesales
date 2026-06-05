const { sql, poolPromise } = require("./db");

async function clearHappyHours() {
    try {
        console.log("🚀 Connecting to database...");
        const pool = await poolPromise;
        
        console.log("🧹 Clearing HappyHours table...");
        await pool.request().query("DELETE FROM dbo.HappyHours");
        
        console.log("✅ Success: All Happy Hours records have been removed.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error clearing table:", err);
        process.exit(1);
    }
}

clearHappyHours();
