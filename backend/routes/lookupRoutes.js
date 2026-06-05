const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

// GET Categories
router.get("/categories", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT DISTINCT CategoryName 
            FROM CategoryMaster 
            WHERE isActive = 1 AND CategoryName IS NOT NULL AND CategoryName != ''
            ORDER BY CategoryName
        `);
        res.json({ success: true, data: result.recordset.map(r => r.CategoryName) });
    } catch (err) {
        console.error("Categories error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET Dishgroups (Optional filtering by category name)
router.get("/dishgroups", async (req, res) => {
    try {
        const { category } = req.query;
        console.log(`🔍 DISHGROUPS - Category filter: "${category}"`);
        const pool = await poolPromise;
        const request = pool.request();

        let query;
        if (category) {
            // Filter dishgroups that belong to the selected category
            request.input('category', sql.NVarChar, category.trim());
            query = `
                SELECT DISTINCT dg.DishGroupName 
                FROM DishGroupMaster dg
                JOIN CategoryMaster c ON dg.CategoryId = c.CategoryId
                WHERE dg.IsActive = 1 
                  AND dg.DishGroupName IS NOT NULL 
                  AND dg.DishGroupName != ''
                  AND REPLACE(ISNULL(c.CategoryName,''), ' ', '') LIKE '%' + REPLACE(@category, ' ', '') + '%'
                ORDER BY dg.DishGroupName
            `;
        } else {
            query = `
                SELECT DISTINCT DishGroupName 
                FROM DishGroupMaster 
                WHERE IsActive = 1 AND DishGroupName IS NOT NULL AND DishGroupName != ''
                ORDER BY DishGroupName
            `;
        }

        const result = await request.query(query);
        console.log(`✅ DISHGROUPS returned ${result.recordset.length} rows`);
        res.json({ success: true, data: result.recordset.map(r => r.DishGroupName) });
    } catch (err) {
        console.error("❌ DISHGROUPS error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET DishNames (Optional filtering by dishgroup name)
router.get("/dishes", async (req, res) => {
    try {
        const { dishGroup } = req.query;
        console.log(`🔍 DISHES - DishGroup filter: "${dishGroup}"`);
        const pool = await poolPromise;
        const request = pool.request();

        let query;
        if (dishGroup) {
            request.input('dishGroup', sql.NVarChar, dishGroup.trim());
            query = `
                SELECT DISTINCT d.Name 
                FROM DishMaster d
                JOIN DishGroupMaster dg ON d.DishGroupId = dg.DishGroupId
                WHERE d.IsActive = 1 
                  AND d.Name IS NOT NULL 
                  AND d.Name != ''
                  AND REPLACE(ISNULL(dg.DishGroupName,''), ' ', '') LIKE '%' + REPLACE(@dishGroup, ' ', '') + '%'
                ORDER BY d.Name
            `;
        } else {
            query = `
                SELECT DISTINCT Name 
                FROM DishMaster 
                WHERE IsActive = 1 AND Name IS NOT NULL AND Name != ''
                ORDER BY Name
            `;
        }

        const result = await request.query(query);
        console.log(`✅ DISHES returned ${result.recordset.length} rows`);
        res.json({ success: true, data: result.recordset.map(r => r.Name) });
    } catch (err) {
        console.error("❌ DISHES error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
