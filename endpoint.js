const express = require("express");
const router = express.Router();
const db = require("./db")
const bcrypt = require("bcrypt");

/*
route pour récuperer tout les produits
GET /api/produits
*/
router.get("/produits", (req,res) =>{
    db.query("SELECT * FROM produit", (err, result) =>{
        if(err){
            return res.status(500).json({message: "Erreur du serveur"});
        }
        res.json(result);
    });
});

//Récupérer un produit par son id
router.get("/produits/:id", (req, res) =>{
    const { id } = req.params;
    db.query("SELECT * FROM produit WHERE id_produit = ?", [id], (err, result) =>{
        if(err){
            return res.status(500).json({message: "Erreur du serveur"});
        }
        if(result.length === 0)
            return res.status(404).json({message: "Produit non trouvé"})

        res.json(result[0]);// "0" permet de retourner seulement le 1er résultat
    });
});

/*Inscription d'un client
POST/api/clients/register
Exemple: JSON
{
"nom": "Dupont"
"Prenom": "Jean"
"Email": "jean.dupont@email.com",
"Mot_de_passe": "monMotDePasse"
}
 */
router.post("/client/register", (req, res) =>{
    const {nom_prenom_client, Telephone_client, Date_inscription_client, Mail_client, mdp_client, adresse_client} = req.body;
    db.query("SELECT * FROM client WHERE Mail_client = ?", [Mail_client], (err, result) =>{
        if(err){
            return res.status(500).json({message: "Erreur du serveur"});
        }

        if(result.length > 0){
            return res.status(400).json({message: "Cette adresse mail est deja utilisé"})
        }
    });

    //Hachage du mot de passe
    bcrypt.hash(mdp_client, 10, (err, hash) =>{
        if (err) {
            return res.status(500).json({message: "Erreur lors du hachage du mot de passe"})
        }
        db.query("INSERT INTO client (nom_prenom_client, Telephone_client, Date_inscription_client, Mail_client, mdp_client, adresse_client) VALUES (?,?,?,?,?,?)",
            [nom_prenom_client, Telephone_client, Date_inscription_client, Mail_client, hash, adresse_client],
            (err, result) =>{
                if (err) {
                    return res.status(500).json({message:"Erreur lors de l'inscription"});
                }
                res.status(201).json({message:"Inscription réussie", id_client: result.insertId})
            })
    });
})

module.exports = router;