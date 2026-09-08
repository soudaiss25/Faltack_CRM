require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");

const authRoutes = require("./routes/auth.routes");
const entrepriseRoutes = require("./routes/entreprise.routes");
const factureRoutes = require("./routes/facture.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const contactRoutes = require("./routes/contact.routes");
const interactionRoutes = require("./routes/interaction.routes");
const depenseRoutes = require("./routes/depense.routes");
const analyseRoutes = require("./routes/analyse.routes");

const utilisateurRoutes = require("./routes/utilisateur.routes");
const honoraireRoutes = require("./routes/honoraire.routes");
const cabinetRoutes = require("./routes/cabinet.routes");
const documentRoutes = require("./routes/document.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/entreprises", entrepriseRoutes);
app.use("/api/factures", factureRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api", contactRoutes);
app.use("/api", interactionRoutes);
app.use("/api", depenseRoutes);
app.use("/api", analyseRoutes);
app.use("/api", honoraireRoutes);
app.use("/api/cabinet", cabinetRoutes);
app.use("/api/utilisateurs", utilisateurRoutes);
app.use("/api", documentRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;

async function demarrer() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connexion à la base de données réussie");
    await sequelize.sync();
    app.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));
  } catch (err) {
    console.error("❌ Impossible de démarrer :", err.message || err.name || "erreur inconnue");
    if (err.errors?.length) {
      err.errors.forEach((e, i) => console.error(`   cause ${i + 1}:`, e.message || e.code || e));
    }
    if (err.original) {
      console.error("   cause originale :", err.original.message || err.original);
    }
    console.error("   Variables lues -> DB_HOST:", process.env.DB_HOST, "| DB_NAME:", process.env.DB_NAME, "| DB_USER:", process.env.DB_USER);
  }
}

demarrer();