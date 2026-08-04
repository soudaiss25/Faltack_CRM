const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Contact = sequelize.define("Contact", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nom: { type: DataTypes.STRING, allowNull: false },
  fonction: { type: DataTypes.STRING, allowNull: true },
  email: { type: DataTypes.STRING, allowNull: true },
  telephone: { type: DataTypes.STRING, allowNull: true },
});

module.exports = Contact;
