const jwt = require("jsonwebtoken")

//Création du middleware
const verifyToken = (req, res, next) =>{
    const token = req.headers["authorization"];


    if (!token) {
        return res.status(403).json({message: "Token introuvable"});
    }

    jwt.verify(token.split(" ")[1],
        process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log("❌ Erreur lors de la vérification du token :", err.name, "-", err.message);
            return res.status(401).json({message: "Token invalide"});

        }
        req.client = decoded;
        next();
    }
)}


module.exports = {verifyToken};