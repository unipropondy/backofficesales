const { poolPromise } = require("./db");

async function refreshAll() {
  try {
    const pool = await poolPromise;

    // Get all views in the database
    const res = await pool.request().query(`
      SELECT name 
      FROM sys.views 
      WHERE schema_id = SCHEMA_ID('dbo')
    `);

    const views = res.recordset;
    console.log(`Found ${views.length} views to refresh.`);

    for (let view of views) {
      try {
        console.log(`Refreshing view dbo.${view.name}...`);
        await pool.request().query(`EXEC sp_refreshview 'dbo.${view.name}'`);
      } catch (err) {
        console.warn(`⚠️ Warning: Could not refresh view dbo.${view.name}: ${err.message}`);
      }
    }

    console.log("All view refreshes completed!");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

refreshAll();
