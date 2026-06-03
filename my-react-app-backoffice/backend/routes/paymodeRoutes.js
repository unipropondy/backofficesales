const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

// ================= GET =================
router.get("/", async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().query("SELECT * FROM Paymode ORDER BY Position");
  res.json(result.recordset);
});

// ================= INSERT =================
router.post("/", async (req, res) => {
  try {
    const { position, paymode, description, active, entertainment, image } = req.body;

    // Validate required fields
    if (!paymode || !paymode.toString().trim()) {
      return res.status(400).json({ error: "Paymode name is required." });
    }

    const pool = await poolPromise;

    await pool.request()
      .input("Position", sql.Decimal(18,2), Number(position))
      .input("PayMode", sql.VarChar, paymode)
      .input("Description", sql.VarChar, description)
      .input("Active", sql.Bit, active ? 1 : 0)
      .input("isEntertainment", sql.Bit, entertainment ? 1 : 0)
      .input("PaymodeImage", sql.NVarChar, image || "")
      .query(`
        INSERT INTO Paymode 
        (Position, PayMode, Description, Active, isEntertainment, PaymodeImage)
        VALUES 
        (@Position, @PayMode, @Description, @Active, @isEntertainment, @PaymodeImage)
      `);

    res.send("Inserted Successfully");

  } catch (err) {
    console.log(err);
    res.status(500).send("Insert Error");
  }
});

// ================= UPDATE (🔥 FINAL FIX) =================
router.put("/:id", async (req, res) => {
  try {
    const { position, paymode, description, active, entertainment, image } = req.body;

    // Validate required fields
    if (!paymode || !paymode.toString().trim()) {
      return res.status(400).json({ error: "Paymode name is required." });
    }

    const pool = await poolPromise;

    const oldPos = parseFloat(req.params.id);
    const newPos = parseFloat(position);

    console.log("OLD 👉", oldPos);
    console.log("NEW 👉", newPos);

    const result = await pool.request()
      .input("OldPosition", sql.Decimal(18,2), oldPos)
      .input("NewPosition", sql.Decimal(18,2), newPos)
      .input("PayMode", sql.VarChar, paymode)
      .input("Description", sql.VarChar, description)
      .input("Active", sql.Bit, active ? 1 : 0)
      .input("isEntertainment", sql.Bit, entertainment ? 1 : 0)
      .input("PaymodeImage", sql.NVarChar, image || "")
      .query(`
        UPDATE TOP (1) Paymode
        SET 
          Position = @NewPosition,
          PayMode = @PayMode,
          Description = @Description,
          Active = @Active,
          isEntertainment = @isEntertainment,
          PaymodeImage = @PaymodeImage
        WHERE Position = @OldPosition
      `);

    console.log("Rows 👉", result.rowsAffected);

    if (result.rowsAffected[0] === 0) {
      return res.status(400).send("Update failed");
    }

    res.send("Updated Successfully");

  } catch (err) {
    console.log(err);
    res.status(500).send("Update Error");
  }
});

module.exports = router;