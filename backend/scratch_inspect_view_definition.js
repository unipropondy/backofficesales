const { poolPromise } = require("./db");

async function check() {
  try {
    const pool = await poolPromise;
    console.log("Fetching definition of vw_dishwisesales...");
    const res = await pool.request().query(`
      SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.vw_dishwisesales')) AS ViewDefinition
    `);
    console.log(res.recordset[0].ViewDefinition);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
