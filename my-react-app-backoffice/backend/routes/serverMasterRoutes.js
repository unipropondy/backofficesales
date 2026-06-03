const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

// ================= GET ALL SERVERS =================
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM [server] ORDER BY SER_NAME");
    res.json(result.recordset);
  } catch (err) {
    console.error("GET Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ================= INSERT NEW SERVER =================
router.post("/", async (req, res) => {
  try {
    const { SER_NAME, Activeflag } = req.body;

    if (!SER_NAME || !SER_NAME.trim()) {
      return res.status(400).json({ error: "Server name is required." });
    }

    const pool = await poolPromise;
    await pool.request()
      .input("SER_NAME", sql.VarChar, SER_NAME)
      .input("Activeflag", sql.Bit, Activeflag ? 1 : 0)
      .query(`
        INSERT INTO [server] (SER_NAME, Activeflag, CreatedDate)
        VALUES (@SER_NAME, @Activeflag, GETDATE())
      `);

    res.json({ success: true, message: "Server inserted successfully" });
  } catch (err) {
    console.error("INSERT Error:", err);
    res.status(500).json({ error: "Insert Error" });
  }
});

// ================= UPDATE SERVER =================
router.put("/:id", async (req, res) => {
  try {
    const { SER_NAME, Activeflag } = req.body;
    const { id } = req.params;

    if (!SER_NAME || !SER_NAME.trim()) {
      return res.status(400).json({ error: "Server name is required." });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input("SER_ID", sql.Int, id)
      .input("SER_NAME", sql.VarChar, SER_NAME)
      .input("Activeflag", sql.Bit, Activeflag ? 1 : 0)
      .query(`
        UPDATE [server]
        SET SER_NAME = @SER_NAME,
            Activeflag = @Activeflag,
            ModifiedDate = GETDATE()
        WHERE SER_ID = @SER_ID
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Server not found" });
    }

    res.json({ success: true, message: "Server updated successfully" });
  } catch (err) {
    console.error("UPDATE Error:", err);
    res.status(500).json({ error: "Update Error" });
  }
});

// ================= DELETE SERVER =================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const result = await pool.request()
      .input("SER_ID", sql.Int, id)
      .query("DELETE FROM [server] WHERE SER_ID = @SER_ID");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Server not found" });
    }

    res.json({ success: true, message: "Server deleted successfully" });
  } catch (err) {
    console.error("DELETE Error:", err);
    res.status(500).json({ error: "Delete Error" });
  }
});

module.exports = router;
