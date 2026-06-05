const { poolPromise } = require('./db');

async function testDishGroup() {
  try {
    const pool = await poolPromise;
    const res = await pool.request().query("SELECT TOP 1 * FROM DishGroupMaster");
    console.log("DishGroupMaster OK:", res.recordset);
    
    try {
        const res2 = await pool.request().query("SELECT TOP 1 * FROM DishGroup");
        console.log("DishGroup OK:", res2.recordset);
    } catch(e) {
        console.log("DishGroup ERROR:", e.message);
    }

    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

testDishGroup();
