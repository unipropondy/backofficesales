const fs = require('fs');
const path = require('path');

module.exports = (err, req, res, next) => {
  console.error("🔥 Error Handler Caught:", err);
  
  // Ensure logs folder exists
  const logDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Log error to file
  const logFilePath = path.join(logDir, 'error.log');
  fs.appendFileSync(logFilePath, `\n[${new Date().toISOString()}] ERROR: ${err.stack || err}\n`);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};
