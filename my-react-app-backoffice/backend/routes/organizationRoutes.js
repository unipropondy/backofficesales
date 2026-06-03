const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

/* ===============================
   GET ORGANIZATION
================================*/
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        -- Master tab fields (remove Location)
        BusinessUnitCode, Name, CompanyNameInRcptLine1, CompanyNameInRcptLine2,
        Address1_Line1, Address1_Line2, Address1_City, Address1_State, Address1_Country,
        Address1_PostalCode, Address1_Telephone1, Address1_Fax1, Address1_EmailId1,
        WebSite, LocationName, DisplayMessage,
        
        -- Service tab fields
        GstRegno, GstPercentage, GstType, BillCopy, MAX_INV_SPLIT, ServiceChargePerc,
        TableValidation, ForceModifier, DisplayCode, CheckoutPrint, ReceiptPrint,
        IsActive, IsServiceChargeAllowed, IsOrderPrint, IsKitchenPrint, IsCallerPrinter,
        
        -- Transaction tab fields
        InvoicePrefix, NextInvoiceNumber,
        QuotePrefix, NextQuoteNumber,
        CustomerPreFix, NextCustomerNumber,
        BookingPrefix, NextBookingNumber,
        OrderPrefix, NextOrderNumber,
        UserPrefix, NextUserNumber,
        DoorDeliveryOrderPrefix, NextDoorDeliveryOrderNumber,
        WriteInDishPrefix, NextWriteInDishNumber,
        TranPrefix, NextTranNumber,
        DishPrefix, NextDishNumber,
        DishGroupPrefix, NextDishGroupNumber,
        BillPrefix, NextBillNumber
        
      FROM Organization
    `);
    
    console.log("🔍 BACKEND SENDING DATA");
    res.json(result.recordset[0] || {});
  } catch (err) {
    console.error("❌ GET ORG ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
/* ===============================
   UPDATE ORGANIZATION
================================*/
router.post("/", async (req, res) => {
  console.log("🚀 ORG API HIT");
  console.log("📦 Received data:", req.body);

  try {
    const pool = await poolPromise;
    
    const orgResult = await pool.request().query("SELECT TOP 1 BusinessUnitId FROM Organization");
    if (orgResult.recordset.length === 0) {
      return res.status(404).json({ error: "No organization found" });
    }
    
    const businessUnitId = orgResult.recordset[0].BusinessUnitId;
    
    // Field mapping (frontend -> database)
    const fieldMapping = {
      'isActive': 'IsActive',
      'isPDAAttached': 'IsPDAAttached',
      'isServiceChargeAllowed': 'IsServiceChargeAllowed',
      'isOrderPrint': 'IsOrderPrint',
      'iskitchenPrint': 'IsKitchenPrint',
      'isCallerPrinter': 'IsCallerPrinter',
      // Settings tab fields
      'MaxDiscount': 'MaxDiscount',
      'DefaultDiscount': 'DefaultDiscount',
      'CustDispMsg1': 'CustDispMsg1',
      'CustDispMsg2': 'CustDispMsg2',
      'isTerminalTableValidation': 'isTerminalTableValidation',
      'isPaymentFromtable': 'isPaymentFromtable',
      'AdditionOrderSymbol': 'AdditionOrderSymbol',
      'NameMaxlength': 'NameMaxlength',
      'OtherLanguageMaxlength': 'OtherLanguageMaxlength',
      'DisplayMessage': 'DisplayMessage'
      
    };
    
    const request = pool.request();
    const updateFields = [];
    
    request.input("BusinessUnitId", sql.UniqueIdentifier, businessUnitId);
    
    for (const [key, value] of Object.entries(req.body)) {
      // Get database column name
      const dbKey = fieldMapping[key] || key;
      
      // SKIP system fields
      if (dbKey === 'BusinessUnitId' || dbKey === 'CreatedBy' || dbKey === 'CreatedOn' || 
          dbKey === 'ModifiedBy' || dbKey === 'ModifiedOn') {
        continue;
      }
      
      updateFields.push(`${dbKey} = @${dbKey}`);
      
      // Handle boolean fields - INCLUDING Settings tab checkboxes
      if (dbKey === 'IsActive' || dbKey === 'TableValidation' || dbKey === 'ForceModifier' || 
          dbKey === 'DisplayCode' || dbKey === 'IsServiceChargeAllowed' || dbKey === 'IsOrderPrint' ||
          dbKey === 'CheckoutPrint' || dbKey === 'ReceiptPrint' || dbKey === 'IsKitchenPrint' || 
          dbKey === 'IsCallerPrinter' || dbKey === 'IsPDAAttached' ||
          dbKey === 'isTerminalTableValidation' || dbKey === 'isPaymentFromtable') {
        const boolValue = (value === true || value === 1 || value === '1' || value === 'true');
        request.input(dbKey, sql.Bit, boolValue ? 1 : 0);
        console.log(`🔍 Saving ${dbKey}: ${boolValue ? 1 : 0}`);
      }
      // Handle Message Option as BIT
      else if (dbKey === 'MessageOption') {
        let boolValue = false;
        if (value === true || value === 1 || value === '1' || value === 'true' || value === 'Y' || value === 'Yes') {
          boolValue = true;
        } else if (value === false || value === 0 || value === '0' || value === 'false' || value === 'N' || value === 'No') {
          boolValue = false;
        } else if (typeof value === 'string' && value.length > 2) {
          console.log(`⚠️ Skipping MessageOption from Master tab: ${value}`);
          continue;
        }
        request.input(dbKey, sql.Bit, boolValue ? 1 : 0);
      }
      // Handle numeric fields
      else if (dbKey === 'GstPercentage' || dbKey === 'ServiceChargePerc' || dbKey === 'BillCopy' || dbKey === 'MAX_INV_SPLIT' ||
               dbKey === 'MaxDiscount' || dbKey === 'DefaultDiscount' || dbKey === 'NameMaxlength' || dbKey === 'OtherLanguageMaxlength') {
        const numValue = (value === null || value === undefined || value === '') ? 0 : parseFloat(value) || 0;
        request.input(dbKey, sql.Decimal(18, 2), numValue);
      }
      // Handle GST Type
      else if (dbKey === 'GstType') {
        let gstValue = 'E';
        if (value === 'Inclusive' || value === 'I') {
          gstValue = 'I';
        } else if (value === 'Exclusive' || value === 'E') {
          gstValue = 'E';
        }
        request.input(dbKey, sql.NVarChar(1), gstValue);
      }
      // Handle GST Reg No
      else if (dbKey === 'GstRegno') {
        const stringValue = (value === null || value === undefined) ? "" : String(value);
        request.input(dbKey, sql.NVarChar(50), stringValue);
      }
      // Handle other string fields
      else {
        const stringValue = (value === null || value === undefined) ? "" : String(value);
        request.input(dbKey, sql.NVarChar(500), stringValue);
      }
    }
    
    if (updateFields.length === 0) {
      return res.json({ success: true, message: "No fields to update" });
    }
    
    const query = `UPDATE Organization SET ${updateFields.join(", ")} WHERE BusinessUnitId = @BusinessUnitId`;
    console.log("Update Query:", query);
    
    const result = await request.query(query);
    console.log("Rows affected:", result.rowsAffected);
    
    res.json({ 
      success: true, 
      message: "Organization updated successfully",
      rowsAffected: result.rowsAffected
    });
    
  } catch (err) {
    console.error("❌ ORG ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
/* ===============================
   GET SETTINGS
================================*/
router.get("/settings", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM MasterSettings ORDER BY ParamCode");
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ SETTINGS FETCH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   GET SETTING BY CODE
================================*/
router.get("/settings/lookup/:code", async (req, res) => {
  try {
    const pool = await poolPromise;
    const code = req.params.code;
    
    const result = await pool.request()
      .input("code", sql.VarChar(50), code)
      .query("SELECT * FROM MasterSettings WHERE ParamCode = @code");
    
    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      res.json(null);
    }
  } catch (err) {
    console.error("❌ LOOKUP ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   SAVE SETTINGS
================================*/
router.post("/settings", async (req, res) => {
  console.log("🚀 SETTINGS API HIT");
  console.log("📦 Received data:", req.body);

  try {
    const pool = await poolPromise;
    const settings = Array.isArray(req.body) ? req.body : [req.body];

    let success = 0;
    let failed = [];

    for (const s of settings) {
      try {
        const { ParamCode, Description, ParamValueType, Value } = s;

        if (!ParamCode) {
          failed.push({ ParamCode, error: "Missing ParamCode" });
          continue;
        }

        const request = pool.request();
        request.input("code", sql.VarChar(50), ParamCode);
        request.input("desc", sql.NVarChar(500), Description || "");

        if (ParamValueType === "B") {
          let bitValue = (Value === true || Value === 1 || Value === "true" || Value === "1") ? 1 : 0;
          request.input("val", sql.Bit, bitValue);
          // Check if record exists, if not insert
          const checkResult = await request.query(`SELECT COUNT(*) as cnt FROM MasterSettings WHERE ParamCode = @code`);
          if (checkResult.recordset[0].cnt === 0) {
            await request.query(`
              INSERT INTO MasterSettings (ParamCode, Description, ParamValueType, ParamBitValue) 
              VALUES (@code, @desc, 'B', @val)
            `);
          } else {
            await request.query(`UPDATE MasterSettings SET ParamBitValue = @val, Description = @desc WHERE ParamCode = @code`);
          }
          console.log(`✅ Saved BIT ${ParamCode}: ${bitValue}`);
        }
        else if (ParamValueType === "N") {
          let numValue = parseFloat(Value) || 0;
          request.input("val", sql.Decimal(18, 2), numValue);
          const checkResult = await request.query(`SELECT COUNT(*) as cnt FROM MasterSettings WHERE ParamCode = @code`);
          if (checkResult.recordset[0].cnt === 0) {
            await request.query(`
              INSERT INTO MasterSettings (ParamCode, Description, ParamValueType, ParamNumericValue) 
              VALUES (@code, @desc, 'N', @val)
            `);
          } else {
            await request.query(`UPDATE MasterSettings SET ParamNumericValue = @val, Description = @desc WHERE ParamCode = @code`);
          }
          console.log(`✅ Saved NUMERIC ${ParamCode}: ${numValue}`);
        }
        else if (ParamValueType === "S") {
          const stringValue = Value ? String(Value) : "";
          request.input("val", sql.NVarChar(500), stringValue);
          const checkResult = await request.query(`SELECT COUNT(*) as cnt FROM MasterSettings WHERE ParamCode = @code`);
          if (checkResult.recordset[0].cnt === 0) {
            await request.query(`
              INSERT INTO MasterSettings (ParamCode, Description, ParamValueType, ParamStringValue) 
              VALUES (@code, @desc, 'S', @val)
            `);
          } else {
            await request.query(`UPDATE MasterSettings SET ParamStringValue = @val, Description = @desc WHERE ParamCode = @code`);
          }
          console.log(`✅ Saved STRING ${ParamCode}: ${stringValue}`);
        }
        else if (ParamValueType === "G") {
          if (!Value || Value === "") {
            await request.query(`UPDATE MasterSettings SET ParamGuidValue = NULL, Description = @desc WHERE ParamCode = @code`);
          } else {
            request.input("val", sql.VarChar(50), String(Value));
            await request.query(`UPDATE MasterSettings SET ParamGuidValue = TRY_CONVERT(uniqueidentifier, @val), Description = @desc WHERE ParamCode = @code`);
          }
          console.log(`✅ Saved GUID ${ParamCode}`);
        }
        success++;
      } catch (innerErr) {
        console.error(`Error saving ${s.ParamCode}:`, innerErr.message);
        failed.push({ ParamCode: s.ParamCode, error: innerErr.message });
      }
    }

    res.json({ success: true, saved: success, failed: failed });
  } catch (err) {
    console.error("MAIN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;