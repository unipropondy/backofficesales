require("dotenv").config();
const express = require("express");
const cors = require("cors");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");

// Prevent server crash on unhandled errors
process.on('uncaughtException', (err) => {
  console.error('🔥 CRITICAL: Uncaught Exception:', err);
  const fs = require('fs');
  fs.appendFileSync('error_log.txt', `\n[${new Date().toISOString()}] UNCAUGHT EXCEPTION: ${err.stack || err}\n`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
  const fs = require('fs');
  fs.appendFileSync('error_log.txt', `\n[${new Date().toISOString()}] UNHANDLED REJECTION: ${reason}\n`);
});

const app = express();

app.use(cors({
  origin: "*"
}));
app.use(express.json());
app.use(requestLogger);

const barcodeRoutes = require("./routes/barcodeRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const happyHoursRoutes = require("./routes/happyhours");
const discountRoutes = require("./routes/discountRoutes");
const paymodeRoutes = require("./routes/paymodeRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const memberRoutes = require("./routes/memberRoutes");
const rewardPointsRoutes = require("./routes/Rewardpoints");
const emailSettingsRoutes = require("./routes/EmailSettings");
const consoleSalesRoutes = require("./routes/consolesalesroutes");
const dishMovementReportRoutes = require("./routes/dishmoventMovemnetReport");
const dishMovementRoutes = require("./routes/dishmoventMovemnet");
const lookupRoutes = require("./routes/lookupRoutes");
const dayEndReportRoutes = require("./routes/dayendreportroutes");
const serverMasterRoutes = require("./routes/serverMasterRoutes");
const dishGroupRoutes = require("./routes/dishGroupRoutes");
const dishOrderItemShareRoutes = require("./routes/dishOrderItemShareRoutes");
const salesReportRoutes = require("./routes/salesreportRoutes");

app.use("/api/barcode", barcodeRoutes);
app.use("/api/dishorderitemshare", dishOrderItemShareRoutes);
app.use("/api/organization", organizationRoutes);
app.use("/api/happyhours", happyHoursRoutes);
app.use("/api/discount", discountRoutes);
app.use("/api/paymode", paymodeRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/rewardpoints", rewardPointsRoutes);
app.use("/api/emailsettings", emailSettingsRoutes);
app.use("/api/consolesales", consoleSalesRoutes);
app.use("/api/dishmovementreport", dishMovementReportRoutes);
app.use("/api/dishmovement", dishMovementRoutes);
app.use("/api/lookup", lookupRoutes);
app.use("/api/dayendreport", dayEndReportRoutes);
app.use("/api/server", serverMasterRoutes);
app.use("/api/dishgroup", dishGroupRoutes);
app.use("/api/salesreport", salesReportRoutes);
app.get("/api/ping", (req, res) => {
  res.json({ success: true, message: "Backend is reachable!" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});