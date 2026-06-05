require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 5000,
  ENV: process.env.NODE_ENV || "development"
};
