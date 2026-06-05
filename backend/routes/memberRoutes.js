const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
const { v4: uuidv4 } = require("uuid");

const TABLE = "dbo.Member";

/* ================= GET ALL MEMBERS ================= */
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT TOP 100 * FROM ${TABLE}
    `);

    res.json(result.recordset || []);

  } catch (err) {
    console.error("❌ GET MEMBERS ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ================= GET MEMBER BY CODE ================= */
router.get("/:code", async (req, res) => {
  try {
    const pool = await poolPromise;
    const { code } = req.params;

    if (!code || code.trim() === "") {
      return res.status(400).json({ error: "Member Code is required." });
    }

    const result = await pool.request()
      .input("code", sql.VarChar, code)
      .query(`SELECT * FROM ${TABLE} WHERE Code = @code`);

    res.json(result.recordset[0] || null);

  } catch (err) {
    console.error("❌ GET MEMBER ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ================= INSERT MEMBER ================= */
router.post("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const d = req.body;

    // ✅ VALIDATION: Check required fields
    if (!d.code || d.code.toString().trim() === "") {
      return res.status(400).json({ error: "Member Code is required." });
    }

    if (!d.companyName || d.companyName.toString().trim() === "") {
      return res.status(400).json({ error: "Company Name is required." });
    }

    if (!d.contactPerson || d.contactPerson.toString().trim() === "") {
      return res.status(400).json({ error: "Contact Person is required." });
    }

    // Prepare input parameters with null checks
    const request = pool.request();
    request.input("MemberId", sql.UniqueIdentifier, uuidv4());
    request.input("Code", sql.VarChar, d.code.toString().trim());
    request.input("Category", sql.VarChar, d.category ? d.category.toString().trim() : "");
    request.input("ContactPerson", sql.VarChar, d.contactPerson.toString().trim());
    request.input("Classification", sql.VarChar, d.classification ? d.classification.toString().trim() : "");
    request.input("CompanyName", sql.VarChar, d.companyName.toString().trim());
    request.input("Email", sql.VarChar, d.email ? d.email.toString().trim() : "");
    request.input("IC", sql.VarChar, d.ic ? d.ic.toString().trim() : "");
    request.input("Phone", sql.VarChar, d.phone ? d.phone.toString().trim() : "");
    request.input("City", sql.VarChar, d.city ? d.city.toString().trim() : "");
    request.input("Postal", sql.VarChar, d.postal ? d.postal.toString().trim() : "");

    await request.query(`
      INSERT INTO ${TABLE} (
        MemberId,
        Code,
        Category,
        ContactPerson,
        Classification,
        CompanyName,
        Email,
        IC,
        Phone,
        City,
        Postal,
        CreatedBy,
        CreatedDate
      )
      VALUES (
        @MemberId,
        @Code,
        @Category,
        @ContactPerson,
        @Classification,
        @CompanyName,
        @Email,
        @IC,
        @Phone,
        @City,
        @Postal,
        NEWID(),
        GETDATE()
      )
    `);

    res.json({ success: true, message: "Member inserted successfully", code: d.code });

  } catch (err) {
    console.error("❌ INSERT MEMBER ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ================= UPDATE MEMBER ================= */
router.put("/:code", async (req, res) => {
  try {
    const pool = await poolPromise;
    const { code } = req.params;
    const d = req.body;

    // ✅ VALIDATION: Check required fields
    if (!code || code.trim() === "") {
      return res.status(400).json({ error: "Member Code is required." });
    }

    if (!d.companyName || d.companyName.toString().trim() === "") {
      return res.status(400).json({ error: "Company Name is required." });
    }

    if (!d.contactPerson || d.contactPerson.toString().trim() === "") {
      return res.status(400).json({ error: "Contact Person is required." });
    }

    // Prepare input parameters
    const request = pool.request();
    request.input("Code", sql.VarChar, code);
    request.input("Category", sql.VarChar, d.category ? d.category.toString().trim() : "");
    request.input("ContactPerson", sql.VarChar, d.contactPerson.toString().trim());
    request.input("Classification", sql.VarChar, d.classification ? d.classification.toString().trim() : "");
    request.input("CompanyName", sql.VarChar, d.companyName.toString().trim());
    request.input("Email", sql.VarChar, d.email ? d.email.toString().trim() : "");
    request.input("IC", sql.VarChar, d.ic ? d.ic.toString().trim() : "");
    request.input("Phone", sql.VarChar, d.phone ? d.phone.toString().trim() : "");
    request.input("City", sql.VarChar, d.city ? d.city.toString().trim() : "");
    request.input("Postal", sql.VarChar, d.postal ? d.postal.toString().trim() : "");

    await request.query(`
      UPDATE ${TABLE} SET
        Category = @Category,
        ContactPerson = @ContactPerson,
        Classification = @Classification,
        CompanyName = @CompanyName,
        Email = @Email,
        IC = @IC,
        Phone = @Phone,
        City = @City,
        Postal = @Postal,
        ModifiedDate = GETDATE()
      WHERE Code = @Code
    `);

    res.json({ success: true, message: "Member updated successfully" });

  } catch (err) {
    console.error("❌ UPDATE MEMBER ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ================= DELETE MEMBER ================= */
router.delete("/:code", async (req, res) => {
  try {
    const pool = await poolPromise;
    const { code } = req.params;

    if (!code || code.trim() === "") {
      return res.status(400).json({ error: "Member Code is required." });
    }

    await pool.request()
      .input("Code", sql.VarChar, code)
      .query(`DELETE FROM ${TABLE} WHERE Code = @Code`);

    res.json({ success: true, message: "Member deleted successfully" });

  } catch (err) {
    console.error("❌ DELETE MEMBER ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
