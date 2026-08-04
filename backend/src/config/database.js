require("dotenv").config();
const { Sequelize } = require("sequelize");

// Même logique que le settings.py Django : on lit tout depuis les variables
// d'environnement, jamais de valeur codée en dur dans le fichier.
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
    dialectOptions:
      process.env.DB_SSL === "true"
        ? { ssl: { require: true, rejectUnauthorized: false } } // nécessaire pour Supabase
        : {},
  }
);

module.exports = sequelize;
