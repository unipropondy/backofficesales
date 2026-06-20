const express = require("express");
const router = express.Router();
const { poolPromise } = require("../db");

// Helper to decode double-base64 password
const decodePassword = (encodedPass) => {
  if (!encodedPass) return "";
  try {
    const decoded1 = Buffer.from(encodedPass, "base64").toString("utf-8");
    return Buffer.from(decoded1, "base64").toString("utf-8");
  } catch (e) {
    return "";
  }
};

// Login Route
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    // 1. Check against Environment Variables / Hardcoded Admin Defaults
    const envUsername = process.env.APP_USERNAME || "admin";
    const envPassword = process.env.APP_PASSWORD || "admin123";

    if (username.toLowerCase() === envUsername.toLowerCase() && password === envPassword) {
      console.log(`✅ Login successful for admin user: ${username}`);
      return res.json({
        success: true,
        message: "Login successful",
        token: "session-admin-token-12345",
        user: { username: "admin", role: "Administrator" }
      });
    }

    // 2. Check Database UserMaster Table with Offline Fallback
    try {
      const pool = await poolPromise;
      if (!pool) {
        throw new Error("Database pool is offline");
      }
      
      const result = await pool
        .request()
        .input("username", username)
        .query("SELECT UserId, UserName, UserPassword FROM dbo.UserMaster WHERE UserName = @username AND IsDisabled = 0");

      if (result.recordset.length > 0) {
        const dbUser = result.recordset[0];
        const decodedDbPassword = decodePassword(dbUser.UserPassword);

        if (password === decodedDbPassword) {
          console.log(`✅ Login successful for database user: ${username}`);
          return res.json({
            success: true,
            message: "Login successful",
            token: `session-user-token-${dbUser.UserId}`,
            user: { username: dbUser.UserName, role: "User" }
          });
        }
      }

      // Fallback check for single base64 or exact match if decoding failed
      if (result.recordset.length > 0) {
        const dbUser = result.recordset[0];
        try {
          const singleDecoded = Buffer.from(dbUser.UserPassword || "", "base64").toString("utf-8");
          if (password === singleDecoded || password === dbUser.UserPassword) {
            console.log(`✅ Login successful for database user (fallback match): ${username}`);
            return res.json({
              success: true,
              message: "Login successful",
              token: `session-user-token-${dbUser.UserId}`,
              user: { username: dbUser.UserName, role: "User" }
            });
          }
        } catch (err) {
          // Ignore fallback errors
        }
      }
    } catch (dbErr) {
      console.warn("⚠️ Database connection failed during login. Using offline QA fallback accounts...", dbErr.message);
      
      // QA Fallback accounts when SQL is disconnected/offline
      const qaFallbacks = {
        "123": "786",
        "cafe19": "cafe123",
        "cafe": "cafe123"
      };

      if (qaFallbacks[username.toLowerCase()] && qaFallbacks[username.toLowerCase()] === password) {
        console.log(`✅ Offline QA login successful for fallback account: ${username}`);
        return res.json({
          success: true,
          message: "Login successful (Offline QA Mode)",
          token: `session-qa-token-${username}`,
          user: { username: username.toUpperCase(), role: "QA Tester (Offline)" }
        });
      }
    }

    console.log(`❌ Invalid login attempt for username: ${username}`);
    return res.status(401).json({ success: false, message: "Invalid username or password" });

  } catch (err) {
    console.error("🔥 Login Error:", err.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
