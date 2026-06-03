const express = require("express");
const router = express.Router();
 
const db = require("../db");
const poolPromise = db.poolPromise;
const sql = db.sql;
 
// ✅ FINAL TABLE NAME
const TABLE = "dbo.Discount";
 
/* ================= GET ================= */
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
 
    const result = await pool.request().query(`
      SELECT TOP 100 * FROM ${TABLE}
    `);
 
    res.json(result.recordset);
 
  } catch (err) {
    console.error("GET ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
 
/* ================= INSERT ================= */
router.post("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const d = req.body;
 
    await pool.request()
      .input("DiscountCode", sql.VarChar, d.DiscountCode)
      .input("Description", sql.VarChar, d.Description || "")
      .input("DiscountPercentage", sql.Numeric(18, 2), Number(d.DiscountPercentage) || 0)
      .input("FromDate", sql.SmallDateTime, d.FromDate ? new Date(d.FromDate) : null)
      .input("ToDate", sql.SmallDateTime, d.ToDate ? new Date(d.ToDate) : null)
      .input("isActive", sql.Bit, d.isActive ? 1 : 0)
      .input("isGuestMeal", sql.Bit, d.isGuestMeal ? 1 : 0)
      .input("Backcolor", sql.VarChar, d.Backcolor || "")
      .input("ForeColor", sql.VarChar, d.ForeColor || "")
 
 
.query(`
  INSERT INTO ${TABLE} (
    Discountid,
    DiscountCode,
    Description,
    DiscountPercentage,
    FromDate,
    ToDate,
    DiscountQty,
    Discountprice,
    ActualPrice,
    isActive,
    CreatedBy,
    CreatedDate,
    isGuestMeal,
    Paymode,
    Backcolor,
    ForeColor,
    DiscountAmount
  )
  VALUES (
    NEWID(),
    @DiscountCode,
    @Description,
    @DiscountPercentage,
    @FromDate,
    @ToDate,
    0,              -- ✅ FIX
    0,              -- ✅ FIX
    0,              -- ✅ FIX
    @isActive,
    NEWID(),        -- ✅ FIX
    GETDATE(),
    @isGuestMeal,
    0,              -- ✅ FIX
    @Backcolor,
    @ForeColor,
    0               -- ✅ FIX
  )
`)
    res.json({ message: "Inserted successfully" });
 
  } catch (err) {
    console.error("INSERT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
 
/* ================= UPDATE ================= */
router.put("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    const d = req.body;
 
    await pool.request()
      .input("id", sql.UniqueIdentifier, req.params.id)
      .input("DiscountCode", sql.VarChar, d.DiscountCode)
      .input("Description", sql.VarChar, d.Description || "")
      .input("DiscountPercentage", sql.Numeric(18, 2), Number(d.DiscountPercentage) || 0)
      .input("FromDate", sql.SmallDateTime, d.FromDate ? new Date(d.FromDate) : null)
      .input("ToDate", sql.SmallDateTime, d.ToDate ? new Date(d.ToDate) : null)
      .input("isActive", sql.Bit, d.isActive ? 1 : 0)
      .input("isGuestMeal", sql.Bit, d.isGuestMeal ? 1 : 0)
      .input("Backcolor", sql.VarChar, d.Backcolor || "")
      .input("ForeColor", sql.VarChar, d.ForeColor || "")
 
      .query(`
        UPDATE ${TABLE} SET
          DiscountCode = @DiscountCode,
          Description = @Description,
          DiscountPercentage = @DiscountPercentage,
          FromDate = @FromDate,
          ToDate = @ToDate,
          isActive = @isActive,
          isGuestMeal = @isGuestMeal,
          Backcolor = @Backcolor,
          ForeColor = @ForeColor,
          ModyfiedDate = GETDATE()  -- ✅ IMPORTANT (correct DB spelling)
        WHERE Discountid = @id
      `);
 
    res.json({ message: "Updated successfully" });
 
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
 
/* ================= DELETE ================= */
router.delete("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
 
    await pool.request()
      .input("id", sql.UniqueIdentifier, req.params.id)
      .query(`
        DELETE FROM ${TABLE} WHERE Discountid = @id
      `);
 
    res.json({ message: "Deleted successfully" });
 
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
 
module.exports = router;
 