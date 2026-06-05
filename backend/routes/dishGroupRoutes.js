const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

// GET all Dish Groups
router.get("/", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                DishGroupId,
                DishGroupCode,
                DishGroupName,
                IsActive,
                isKitchenprint as KitchenPrint,
                isDiscountAllowed as Discount,
                SortCode,
                KitchenSortCode
            FROM DishGroupMaster
            ORDER BY SortCode, DishGroupName
        `);
        
        // Ensure properties are mapped correctly for frontend
        const mappedData = result.recordset.map(row => ({
            DishGroupCode: row.DishGroupCode ? row.DishGroupCode.trim() : "",
            DishGroupName: row.DishGroupName ? row.DishGroupName.trim() : "",
            Active: row.IsActive ? "Yes" : "No",
            KitchenPrint: row.KitchenPrint ? "Yes" : "No",
            Discount: row.Discount ? "Yes" : "No",
            SortCode: row.SortCode || 0,
            KitchenSortCode: row.KitchenSortCode || 0
        }));

        res.json(mappedData);
    } catch (err) {
        console.error("DishGroup error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
