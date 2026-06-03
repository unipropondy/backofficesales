const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

// ================= GET ALL DISH ORDER ITEM SHARES =================
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(
      "SELECT Id, OrderDishId, CustomerName, IsSelected, CreatedDate FROM dishOrderItemShare ORDER BY CreatedDate DESC"
    );
    res.json(result.recordset);
  } catch (err) {
    console.error("GET Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ================= INSERT NEW DISH ORDER ITEM SHARE =================
router.post("/", async (req, res) => {
  try {
    const { CustomerName, IsSelected } = req.body;
    const OrderDishId = req.body.OrderDishId ? req.body.OrderDishId : null;

    if (!CustomerName || !CustomerName.trim()) {
      return res.status(400).json({ error: "Customer Name is required." });
    }

    const pool = await poolPromise;
    await pool.request()
      .input("OrderDishId", sql.UniqueIdentifier, OrderDishId)
      .input("CustomerName", sql.NVarChar(100), CustomerName)
      .input("IsSelected", sql.Bit, IsSelected ? 1 : 0)
      .query(`
        INSERT INTO dishOrderItemShare (OrderDishId, CustomerName, IsSelected, CreatedDate)
        VALUES (@OrderDishId, @CustomerName, @IsSelected, GETDATE())
      `);

    res.json({ success: true, message: "Dish order item share inserted successfully" });
  } catch (err) {
    console.error("INSERT Error:", err);
    res.status(500).json({ error: "Insert Error" });
  }
});

// ================= UPDATE DISH ORDER ITEM SHARE =================
router.put("/:id", async (req, res) => {
  try {
    const { CustomerName, IsSelected } = req.body;
    const { id } = req.params;

    if (!CustomerName || !CustomerName.trim()) {
      return res.status(400).json({ error: "Customer Name is required." });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input("Id", sql.UniqueIdentifier, id)
      .input("CustomerName", sql.NVarChar(100), CustomerName)
      .input("IsSelected", sql.Bit, IsSelected ? 1 : 0)
      .query(`
        UPDATE dishOrderItemShare
        SET CustomerName = @CustomerName,
            IsSelected = @IsSelected
        WHERE Id = @Id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Dish order item share not found" });
    }

    res.json({ success: true, message: "Dish order item share updated successfully" });
  } catch (err) {
    console.error("UPDATE Error:", err);
    res.status(500).json({ error: "Update Error" });
  }
});

// ================= DELETE DISH ORDER ITEM SHARE =================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const result = await pool.request()
      .input("Id", sql.UniqueIdentifier, id)
      .query("DELETE FROM dishOrderItemShare WHERE Id = @Id");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Dish order item share not found" });
    }

    res.json({ success: true, message: "Dish order item share deleted successfully" });
  } catch (err) {
    console.error("DELETE Error:", err);
    res.status(500).json({ error: "Delete Error" });
  }
});

module.exports = router;