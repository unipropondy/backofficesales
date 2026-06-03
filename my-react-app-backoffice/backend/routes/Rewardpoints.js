const express = require("express");
const router = express.Router();

console.log("✅ Rewardpoints route loaded");

// 🔥 SAFE DB LOAD
let sql, poolPromise;
let dbReady = true;

try {
  const db = require("../db");
  sql = db.sql;
  poolPromise = db.poolPromise;
} catch (err) {
  console.error("❌ DB LOAD ERROR:", err.message);
  dbReady = false;
}

/* ================= TEST ================= */
router.get("/test", (req, res) => {
  res.send("Reward API Working");
});

/* ================= GET ================= */
router.get("/", async (req, res) => {
  try {
    console.log("GET /rewardpoints hit");

    if (!dbReady) {
      return res.json({ message: "DB not connected" });
    }

    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        Id,
        FromDate,
        ToDate,
        Amount,
        PointsUsage,
        Discount,
        DefaultDisc,
        DefaultPoint
      FROM RewardPointDetails
    `);

    res.json(result.recordset);

  } catch (err) {
    console.error("GET ERROR:", err.message);
    res.status(500).send(err.message);
  }
});

/* ================= POST ================= */
router.post("/", async (req, res) => {
  try {
    console.log("POST /rewardpoints hit");
    console.log("REQ BODY:", req.body); // 🔥 DEBUG

    if (!dbReady) {
      return res.status(500).send("DB not connected");
    }

    const {
      startMonth,
      endMonth,
      amount,
      points,
      discount,
      redeem,
      bday
    } = req.body;

    // 🔥 DATE SAFE CONVERSION
    const fromDate = startMonth ? new Date(startMonth) : null;
    const toDate = endMonth ? new Date(endMonth) : null;

    console.log("Converted Dates:", fromDate, toDate); // 🔥 DEBUG

    const pool = await poolPromise;

    await pool.request()
      .input("Id", sql.UniqueIdentifier, require("uuid").v4())
      .input("Denomination", sql.Decimal(18,2), 1)
      .input("PointsUsage", sql.Decimal(18,2), Number(points) || 0)
      .input("FromDate", sql.SmallDateTime, fromDate)
      .input("ToDate", sql.SmallDateTime, toDate)
      .input("CreateUser", sql.UniqueIdentifier, require("uuid").v4())
      .input("CreateDate", sql.SmallDateTime, new Date())
      .input("ModifyUser", sql.UniqueIdentifier, require("uuid").v4())
      .input("ModifyDate", sql.SmallDateTime, new Date())
      .input("Amount", sql.Decimal(18,2), Number(amount) || 0)
      .input("Discount", sql.Decimal(18,2), Number(discount) || 0)
      .input("DefaultDisc", sql.Decimal(18,2), Number(bday) || 0)
      .input("DefaultPoint", sql.Decimal(18,2), Number(redeem) || 0)

      .query(`
        INSERT INTO RewardPointDetails
        (
          Id,
          Denomination,
          PointsUsage,
          FromDate,
          ToDate,
          CreateUser,
          CreateDate,
          ModifyUser,
          ModifyDate,
          Amount,
          Discount,
          DefaultDisc,
          DefaultPoint
        )
        VALUES
        (
          @Id,
          @Denomination,
          @PointsUsage,
          @FromDate,
          @ToDate,
          @CreateUser,
          @CreateDate,
          @ModifyUser,
          @ModifyDate,
          @Amount,
          @Discount,
          @DefaultDisc,
          @DefaultPoint
        )
      `);

    console.log("✅ INSERT SUCCESS"); // 🔥 CONFIRM

    res.json({ message: "Saved Successfully" });

  } catch (err) {
    console.error("POST ERROR:", err.message);
    res.status(500).send(err.message);
  }
});

module.exports = router;