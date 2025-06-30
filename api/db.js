require("dotenv").config({ path: "../.env" });

const { Sequelize } = require("sequelize");
let pgPool = null;

// Determine database dialect
const DB_DIALECT = process.env.DB_DIALECT || "postgres";

// Setup Sequelize
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: DB_DIALECT,
  logging: false
});

// Test Sequelize connection
sequelize
  .authenticate()
  .then(() => console.log(`✅ Connected to ${DB_DIALECT.toUpperCase()} via Sequelize`))
  .catch((err) => console.error(`❌ Sequelize ${DB_DIALECT.toUpperCase()} connection error:`, err));

// If using PostgreSQL, setup native pg Pool as well
if (DB_DIALECT === "postgres") {
  const { Pool } = require("pg");

  pgPool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
  });

  pgPool
    .connect()
    .then(() => console.log("✅ Connected to PostgreSQL via pg.Pool"))
    .catch((err) => console.error("❌ pg.Pool connection error:", err));
}

// Export both
module.exports = {
  sequelize,
  pgPool // will be null if using MySQL
};
