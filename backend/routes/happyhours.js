const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

console.log("🔥 HAPPYHOURS (FIXED DISH NAME MAPPING & DISH GROUP)");

/* =======================================================
   ✅ 1. FETCH DATA
   ======================================================= */
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const dishGroup = req.query.dishGroup;

    let query = `
      SELECT
        d.DishId,
        d.DishCode,
        d.Name,
        p.Amount as Price,
        d.DishGroupId
      FROM DishMaster d
      LEFT JOIN (
          SELECT DishId, MIN(Amount) as Amount FROM DishPriceList GROUP BY DishId
      ) p ON d.DishId = p.DishId
    `;

    const request = pool.request();

    if (dishGroup && dishGroup !== "null" && dishGroup !== "undefined" && dishGroup !== "all") {
      query += ` WHERE d.DishGroupId = @dishGroup`;
      request.input("dishGroup", sql.UniqueIdentifier, dishGroup);
    }

    const result = await request.query(query);

    const formatted = result.recordset.map(row => ({
      selected: false,
      dishId: row.DishId,
      dishCode: row.DishCode || row.DishId,
      dishName: row.Name || "Unknown",
      price: Number(row.Price || 0).toFixed(2),
      promoPrice: ""
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("🔥 FETCH ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =======================================================
   ✅ 2. DISH GROUPS - FIXED
   ======================================================= */
router.get("/dishgroups", async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Simplified check
    const tableCheck = await pool.request().query(`
      SELECT 1 FROM sys.objects WHERE name = 'DishGroupMaster' AND type = 'U'
    `);
    
    if (tableCheck.recordset.length === 0) {
      return res.json({ success: true, data: [] });
    }
    
    const result = await pool.request().query(`
      SELECT DishGroupId, DishGroupCode, DishGroupName 
      FROM DishGroupMaster 
      ORDER BY DishGroupName
    `);
    
    const mapped = result.recordset.map(row => ({
      id: row.DishGroupId,
      code: row.DishGroupCode?.trim() || row.DishGroupId,
      name: row.DishGroupName?.trim() || "Unnamed Group"
    }));
    
    res.json({ success: true, data: mapped });
  } catch (err) {
    console.error("🔥 DISHGROUP ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =======================================================
   ✅ 3. GET REPORT (FETCH SAVED PROMOS)
   ======================================================= */
router.get("/report", async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Check for required tables
    const checkTables = await pool.request().query(`
      SELECT name FROM sys.objects 
      WHERE name IN ('HappyHours', 'DishMaster', 'DishGroupMaster') AND type = 'U'
    `);
    const existingTables = checkTables.recordset.map(r => r.name);
    
    if (!existingTables.includes('HappyHours')) return res.json({ success: true, data: [] });

    // Build query dynamically based on existing tables to avoid crashes
    let query = `
      SELECT
        h.PromotionId,
        h.PromotionCode,
        h.Description,
        h.FromTime,
        h.ToTime,
        h.FromDate,
        h.ToDate,
        h.DishId as InventoryID,
        h.PromotionPrice as PromoPrice,
        h.PromotionPerc,
        h.PromoType,
        h.DishGroupId
    `;

    if (existingTables.includes('DishMaster')) {
      query += `, d.Name as DishName, d.DishCode `;
    } else {
      query += `, NULL as DishName, NULL as DishCode `;
    }

    if (existingTables.includes('DishGroupMaster')) {
      query += `, g.DishGroupName `;
    } else {
      query += `, NULL as DishGroupName `;
    }

    query += ` FROM dbo.HappyHours h `;

    if (existingTables.includes('DishMaster')) {
      query += ` LEFT JOIN dbo.DishMaster d ON h.DishId = d.DishId `;
    }

    if (existingTables.includes('DishGroupMaster')) {
      query += ` LEFT JOIN dbo.DishGroupMaster g ON h.DishGroupId = g.DishGroupId `;
    }

    const result = await pool.request().query(query);
    const formatted = result.recordset.map(row => ({
      PromotionId: row.PromotionId,
      PromotionCode: row.PromotionCode,
      Description: row.Description || "",
      FromTime: row.FromTime,
      ToTime: row.ToTime,
      FromDate: row.FromDate,
      ToDate: row.ToDate,
      InventoryID: row.DishCode || row.InventoryID,
      DishName: row.DishName || "Unknown Dish",
      DishCode: row.DishCode || "N/A",
      Price: "0.00", // Default since we removed price join for safety
      PromotionPrice: Number(row.PromoPrice || 0).toFixed(2),
      PromotionPerc: row.PromotionPerc,
      PromoType: row.PromoType,
      DishGroupName: row.DishGroupName || "N/A",
      DishGroupId: row.DishGroupId
    }));
    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("🔥 REPORT ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =======================================================
   ✅ 3.5 GET DISTINCT PROMOTIONS (FOR LOOKUP)
   ======================================================= */
router.get("/promotions", async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Check if table exists
    const tableCheck = await pool.request().query(`
      SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[HappyHours]') AND type in (N'U')
    `);
    
    if (tableCheck.recordset.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const result = await pool.request().query(`
      SELECT 
        PromotionCode, 
        MAX(Description) as Description, 
        MAX(FromDate) as FromDate, 
        MAX(ToDate) as ToDate,
        MAX(FromTime) as FromTime,
        MAX(ToTime) as ToTime,
        MAX(PromoType) as PromoType,
        MAX(PromotionPerc) as PromotionPerc,
        MAX(PromotionPrice) as PromotionPrice,
        MAX(DishGroupId) as DishGroupId
      FROM dbo.HappyHours
      GROUP BY PromotionCode
    `);
    
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("🔥 PROMOTIONS ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =======================================================
   ✅ 4. SAVE/UPDATE HAPPY HOURS
   ======================================================= */
router.post("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const items = Array.isArray(req.body) ? req.body : [req.body];

    for (let d of items) {
      await pool.request()
        .input("PromotionId", sql.UniqueIdentifier, d.PromotionId)
        .input("PromotionCode", sql.VarChar, d.PromotionCode)
        .input("Description", sql.VarChar, d.Description || "")
        .input("DishGroupId", sql.UniqueIdentifier, d.DishGroupId)
        .input("DishId", sql.UniqueIdentifier, d.DishId)
        .input("FromDate", sql.DateTime, d.FromDate && !isNaN(new Date(d.FromDate)) ? new Date(d.FromDate) : new Date())
        .input("ToDate", sql.DateTime, d.ToDate && !isNaN(new Date(d.ToDate)) ? new Date(d.ToDate) : new Date('2079-06-06'))
        .input("FromTime", sql.VarChar, d.FromTime || '00:00')
        .input("ToTime", sql.VarChar, d.ToTime || '23:59')
        .input("PromotionDay", sql.VarChar, (d.PromotionDay || "").split(',').map(day => day.substring(0, 3)).join(',').substring(0, 50))
        .input("PromotionPerc", sql.Numeric(18, 2), d.PromotionPerc || 0)
        .input("PromotionPrice", sql.Numeric(18, 2), d.PromotionPrice || 0)
        .input("CreatedBy", sql.UniqueIdentifier, d.CreatedBy)
        .input("CreatedOn", sql.DateTime, d.CreatedOn ? new Date(d.CreatedOn) : new Date())
        .input("BusinessUnitId", sql.UniqueIdentifier, d.BusinessUnitId)
        .input("PromoType", sql.VarChar, d.PromoType)
        .query(`
          IF EXISTS (SELECT 1 FROM dbo.HappyHours WHERE PromotionId = @PromotionId)
          BEGIN
            UPDATE dbo.HappyHours SET
              PromotionCode = @PromotionCode,
              Description = @Description,
              DishGroupId = @DishGroupId,
              DishId = @DishId,
              FromDate = @FromDate,
              ToDate = @ToDate,
              FromTime = @FromTime,
              ToTime = @ToTime,
              PromotionDay = @PromotionDay,
              PromotionPerc = @PromotionPerc,
              PromotionPrice = @PromotionPrice,
              PromoType = @PromoType
            WHERE PromotionId = @PromotionId
          END
          ELSE
          BEGIN
            INSERT INTO dbo.HappyHours (
              PromotionId, PromotionCode, Description, DishGroupId, DishId,
              FromDate, ToDate, FromTime, ToTime, PromotionDay,
              PromotionPerc, PromotionPrice, CreatedBy, CreatedOn, BusinessUnitId, PromoType
            ) VALUES (
              @PromotionId, @PromotionCode, @Description, @DishGroupId, @DishId,
              @FromDate, @ToDate, @FromTime, @ToTime, @PromotionDay,
              @PromotionPerc, @PromotionPrice, @CreatedBy, @CreatedOn, @BusinessUnitId, @PromoType
            )
          END
        `);
    }
    res.json({ success: true, message: "Promotion saved/updated." });
  } catch (err) {
    console.error("SAVE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =======================================================
   ✅ 5. DELETE HAPPY HOURS
   ======================================================= */
router.post("/delete", async (req, res) => {
  try {
    const pool = await poolPromise;
    const { promotionIds, dishIds } = req.body;

    if (promotionIds && promotionIds.length > 0) {
      const idList = promotionIds.map(id => `'${id}'`).join(',');
      await pool.request().query(`DELETE FROM dbo.HappyHours WHERE PromotionId IN (${idList})`);
    } else if (dishIds && dishIds.length > 0) {
      const idList = dishIds.map(id => `'${id}'`).join(',');
      await pool.request().query(`DELETE FROM dbo.HappyHours WHERE DishId IN (${idList})`);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;