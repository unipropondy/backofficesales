const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
const { v4: uuidv4 } = require("uuid");
 
 
// ================= DISH LIST =================
router.get("/dish-list", async (req, res) => {
  try {
    const pool = await poolPromise;
 
    if (!pool) {
      return res.json([]); // 🔥 avoid crash
    }
 
    const result = await pool.request().query(`
      SELECT
        D.DishId,
        D.DishCode,
        D.Name AS DishName,
        D.DishGroupId,
        G.DishGroupName,
        D.CurrentCost
      FROM DishMaster D
      LEFT JOIN DishGroupMaster G ON D.DishGroupId = G.DishGroupId
    `);
 
    res.json(result.recordset || []);
 
  } catch (err) {
    console.error("❌ DISH LIST ERROR:", err.message);
    res.json([]); // 🔥 never throw 500
  }
});
 
 
// ================= BARCODE LIST =================
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
 
    if (!pool) {
      return res.json([]);
    }
 
    const result = await pool.request().query(`
      SELECT TOP 100
        B.Id,
        B.BarCode,
        B.Description,
        B.DishId,
        D.DishCode,
        D.Name AS DishName,
        G.DishGroupName,
        D.CurrentCost AS Price
      FROM BarCodeMaster B
      LEFT JOIN DishMaster D ON B.DishId = D.DishId
      LEFT JOIN DishGroupMaster G ON D.DishGroupId = G.DishGroupId
    `);
 
    res.json(result.recordset || []);
 
  } catch (err) {
    console.error("❌ FETCH ERROR:", err.message);
    res.json([]);
  }
});
 
 
// ================= INSERT =================
router.post("/", async (req, res) => {
  try {
    const { DishId, BarCode, Description } = req.body;
 
    // Validate required fields
    if (!DishId || !DishId.toString().trim()) {
      return res.status(400).json({ message: "DishId is required. Please select a dish." });
    }
    if (!BarCode || !BarCode.toString().trim()) {
      return res.status(400).json({ message: "BarCode is required. Please enter a barcode." });
    }
 
    const pool = await poolPromise;
 
    if (!pool) {
      return res.json({ message: "DB not connected" });
    }
 
    // Check for duplicate barcode
    const dupCheck = await pool.request()
      .input("bc", sql.VarChar(100), BarCode.trim())
      .query("SELECT Id FROM BarCodeMaster WHERE BarCode = @bc");
    if (dupCheck.recordset.length > 0) {
      return res.status(400).json({ message: "This barcode already exists. Duplicates are not allowed." });
    }
 
    await pool.request()
      .input("Id", sql.UniqueIdentifier, uuidv4())
      .input("DishId", sql.UniqueIdentifier, DishId)
      .input("BarCode", sql.VarChar(100), BarCode.trim())
      .input("Description", sql.VarChar(200), Description || "")
      .query(`
        INSERT INTO BarCodeMaster (Id, DishId, BarCode, Description)
        VALUES (@Id, @DishId, @BarCode, @Description)
      `);
 
    res.json({ message: "Saved ✅" });
 
  } catch (err) {
    console.error("❌ INSERT ERROR:", err.message);
    res.status(500).json({ message: "Save failed: " + err.message });
  }
});
 
 
// ================= UPDATE =================
router.put("/:id", async (req, res) => {
  try {
    const { DishId, BarCode, Description } = req.body;
 
    // Validate required fields
    if (!DishId || !DishId.toString().trim()) {
      return res.status(400).json({ message: "DishId is required." });
    }
    if (!BarCode || !BarCode.toString().trim()) {
      return res.status(400).json({ message: "BarCode is required." });
    }
 
    const pool = await poolPromise;
 
    if (!pool) {
      return res.json({ message: "DB not connected" });
    }
 
    await pool.request()
      .input("Id", sql.UniqueIdentifier, req.params.id)
      .input("DishId", sql.UniqueIdentifier, DishId)
      .input("BarCode", sql.VarChar(100), BarCode.trim())
      .input("Description", sql.VarChar(200), Description || "")
      .query(`
        UPDATE BarCodeMaster
        SET
          DishId = @DishId,
          BarCode = @BarCode,
          Description = @Description
        WHERE Id = @Id
      `);
 
    res.json({ message: "Updated ✅" });
 
  } catch (err) {
    console.error("❌ UPDATE ERROR:", err.message);
    res.status(500).json({ message: "Update failed: " + err.message });
  }
});
 
// ================= DELETE =================
router.delete("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
 
    if (!pool) {
      return res.json({ message: "DB not connected" });
    }
 
    await pool.request()
      .input("Id", sql.UniqueIdentifier, req.params.id)
      .query("DELETE FROM BarCodeMaster WHERE Id = @Id");
 
    res.json({ message: "Deleted ✅" });
 
  } catch (err) {
    console.error("❌ DELETE ERROR:", err.message);
    res.json({ message: "Delete failed: " + err.message });
  }
});
 
module.exports = router;
 