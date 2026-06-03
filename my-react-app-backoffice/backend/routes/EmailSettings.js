const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

console.log("🔥 NEW BACKEND CODE RUNNING");

/* =========================
   🔹 REPORT LIST
========================= */
router.get("/reports", (req, res) => {
  const reports = [
    "Bill Adjustment","Cancel Order List","Category Sales","Day End",
    "Daywise Sales Detail","Daywise Sales Summary","Discount Item",
    "Dish Sales","DishGroup Sales","FOC Item","Guest Meal",
    "Hourly Sales","Hourly Sales Detail","Hourly Sales Summary",
    "Media Collection","Monthly Sales Detail","Monthly Sales Summary",
    "Paymodewise Sales Detail","Paymodewise Sales Summary",
    "Sales Analysis","Sales Detail","Sales Summary",
    "SalesJournal Detail","SalesJournal Summary",
    "Settlement Summary","Stock list","Stock Report",
    "Table Change","Top N Items","Void Item List","Water Sales"
  ];

  res.json(reports.map(r => ({ ReportName: r })));
});

/* =========================
   🔹 GET USER DATA
========================= */
router.get("/:userName", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("userName", sql.VarChar, req.params.userName)
      .query(`
        SELECT UserName, EMailId AS Email, ReportName, Active
        FROM dbo.emaillist
        WHERE UserName = @userName
      `);

    res.json(result.recordset || []);

  } catch (err) {
    console.log("❌ GET ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   🔹 SAVE / UPDATE
========================= */
router.post("/", async (req, res) => {
  console.log("🚀 SAVE API HIT");

  const { userName, email, reports } = req.body;

  try {
    const pool = await poolPromise;

    if (!userName || !email) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // 🔥 DELETE OLD DATA
    await pool.request()
      .input("userName", sql.VarChar, userName)
      .query("DELETE FROM dbo.emaillist WHERE UserName = @userName");

    // 🔥 INSERT NEW DATA
    for (let r of (reports || [])) {

      const reportName = String(r || "").trim();
      if (!reportName) continue;

      await pool.request()
        .input("userName", sql.VarChar, userName)
        .input("emailId", sql.VarChar, email)
        .input("reportName", sql.VarChar, reportName)
        .input("active", sql.Bit, 1)
        .query(`
          INSERT INTO dbo.emaillist
          (UserName, EMailId, ReportName, Active, CreatedBy, CreatedOn, ModifyBy, ModifyOn)
          VALUES
          (
            @userName,
            @emailId,
            @reportName,
            @active,
            NEWID(),   -- SQL generates GUID
            GETDATE(),
            NEWID(),   -- SQL generates GUID
            GETDATE()
          )
        `);
    }

    res.json({ message: "Saved Successfully ✅" });

  } catch (err) {
    console.log("❌ SAVE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   🔹 DELETE
========================= */
router.delete("/:userName", async (req, res) => {
  try {
    const pool = await poolPromise;

    await pool.request()
      .input("userName", sql.VarChar, req.params.userName)
      .query("DELETE FROM dbo.emaillist WHERE UserName = @userName");

    res.json({ message: "Deleted ✅" });

  } catch (err) {
    console.log("❌ DELETE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;