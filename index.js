const express = require("express")
const cors = require("cors")
const db = require("./db")
const routes = require("./endpoint")
const endpoint = require("./endpoint")

const app = express();
app.use(express.json());
app.use(cors());
app.use("/api", routes)

//Démarrer le serveur
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`L'API Cafthé est démarré sur http://localhost:${PORT}`);
})