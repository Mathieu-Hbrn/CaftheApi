const express = require("express");
const router = express.Router();
const db = require("./db")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")
const {sign} =require("jsonwebtoken")
const {hash} = require("bcrypt");
const {verifyToken} = require ("./middleware")

/*
route pour récuperer tout les produits
GET /api/produits
*/
router.get("/produits", verifyToken, (req,res) =>{

    db.query("SELECT * FROM produit", (err, result) =>{
        if(err){
            return res.status(500).json({message: "Erreur du serveur"});
        }
        res.json(result);
    });
});

//Récupérer les produits d'une catégorie
router.get("/produits/categorie/:id", (req,res) =>{
    const categorieId = req.params.id ;
    db.query("SELECT * FROM produit WHERE id_categorie = ? ", [categorieId], (err, result) =>{
        if(err){
            console.log(err)
            return res.status(500).json({message: "Erreur du serveur"});
        }
        if(result.length === 0) {
            return res.status(404).json({message: "La catégorie n'éxiste pas"})
        } else res.json(result);
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

//acces fiche client
router.get("/client/:id", (req, res) =>{
    const { id } = req.params;
    db.query("SELECT * FROM client WHERE id_client = ?", [id], (err, result) =>{
        if(err){
            return res.status(500).json({message: "Erreur du serveur"});
        }
        if(result.length === 0)
            return res.status(404).json({message: "Client non trouvé"})

        res.json(result).json({message:'fiche client disponible'});
    });
});

// Modification infos client hors mot de passe
router.put("/client/modification/:id", (req, res) =>{
    const {nom_prenom_client, Telephone_client, Mail_client, adresse_client} = req.body;
    const id_client = req.params.id;
    db.query("UPDATE client SET nom_prenom_client = ?, Telephone_client = ?, Mail_client = ?, adresse_client = ? WHERE id_client = ?",
        [nom_prenom_client, Telephone_client, Mail_client, adresse_client, id_client],
        (err, result) =>{
        if(err){
            return res.status(500).json({message: "Erreur du serveur"});
        }


        res.status(200).json( {message: "Modification prise en compte"})
    });
});

// Modification mot de passe client
router.put("/client/update/mdp/:id", (request, response) => {
    const id = request.params.id
    const {last_mdp, new_mdp} = request.body

    db.query("SELECT mdp_client FROM client WHERE id_client = ?", [id], (error, result) => {
        if (error) return response.status(500).json('Erreur serveur')

        bcrypt.compare(last_mdp, result[0].mdp_client, (err,isMatch) => {
            if (err) return response.status(500).json({message:'erreur serveur'});
            if (!isMatch) return response.status(401).json({message:'pas les memes mots de passe'});

            bcrypt.hash(new_mdp, 10, (error, result) => {
                if (error) {
                    return response.status(500).json('Le hachage du mot de passe a raté')
                }
                console.log(result)
                db.query("UPDATE client SET mdp_client = ? WHERE id_client = ?", [result, id], (error, result) => {
                    if (error) {
                        return response.status(500).json('Mot de passe non mis a jour')
                    }
                    response.status(200).json('Mot de passe mis a jour')
                })
            })
        })
    });
});

// Route connexion client
router.post("/client/login", (req,res) => {
    const {email, mot_de_passe} = req.body;

    db.query("SELECT * FROM client WHERE Mail_client = ?", [email], (err, result) => {
        if (err) {return res.status(500).json('Erreur serveur')}
        if (result.length === 0) {
            return res.status(401).json({message: "Identifiant incorrect"});
    }

        const client = result[0];

        // Verification du mot de passe
            bcrypt.compare(mot_de_passe, client.mdp_client, (err, isMatch) => {
                if(err) return res.status(500).json({message: "Erreur serveur"});
                if(!isMatch) return res.status(401).json({message: "Mot de passe incorrect"});

            // Generation d'un token jwt
                const token = sign(
                    {id: client.id_client, email: client.Mail_client}, process.env.JWT_SECRET,
                    {expiresIn: process.env.JWT_EXPIRES_IN },
                );
                res.json({message: "Connexion réussie", token,
                    client: {
                        id: client.Id_client,
                        nom: client.nom_prenom_client,
                        email: client.Mail_client}})
            });
    });
});




// Récupération de la liste des commandes d'un client
router.get("/commande/client/:id", (req, res) =>{
    const { id } = req.params;
    db.query("SELECT * FROM commande WHERE id_client = ? ", [id], (err, result) =>{
        if(err){
            return res.status(500).json({message: "Erreur du serveur"});
        }
        if(result.length === 0)
            return res.status(404).json({message: "Pas de commande"})

        res.json(result);
    });
});


//detail commande client
router.get("/detail_commande/:id", (req, res) =>{
    const { id } = req.params;
    db.query("SELECT * FROM lignecommande WHERE id_commande = ? ", [id], (err, result) =>{
        if(err){
            return res.status(500).json({message: "Erreur du serveur"});
        }
        if(result.length === 0)
            return res.status(404).json({message: "Pas de commande"})

        res.json(result);
    });
});


module.exports = router;