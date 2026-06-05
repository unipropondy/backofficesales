const { poolPromise } = require('./db');

async function clearHappyHours() {
  try {
    const pool = await poolPromise;
    await pool.request().query("DELETE FROM HappyHours");
    console.log("Old saved data from HappyHours has been successfully deleted.");
    process.exit(0);
  } catch (err) {
    console.error("Error clearing table:", err.message);
    process.exit(1);
  }
}

clearHappyHours();
