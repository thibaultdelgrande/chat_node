const bcrypt = require('bcrypt');
const User = require('../models/user');
var jwt = require('jsonwebtoken');

exports.register = (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    // Vérifier si l'utilisateur existe déjà dans la base de données
    User.findOne({ username: username }).then((result) => {
        if (result) {
            res.send('Cet utilisateur existe déjà');
            return;
        }
         // Vérifier si l'email existe déjà dans la base de données
        User.findOne({ email: email }).then((result) => {
            if (result) {
                res.send('Cet email existe déjà');
                return;
            }
            // Vérifier si les mots de passe correspondent
            if (!(password == confirmPassword)){
                res.send('Les mots de passe ne correspondent pas');
                return;
            }

            // Hasher le mot de passe
            const hashedPassword = bcrypt.hashSync(password, 10);

            // Créer un utilisateur
            const user = new User({
                username: username,
                email: email,
                password: hashedPassword
            });

            user.save().then((result) => {
                res.redirect('/login'); 
            })
        });
    });
}

exports.login = (req, res) => {
    const { username, password } = req.body;

    // Vérifier si l'utilisateur existe déjà dans la base de données
    User.findOne({ username: username }).then((result) => {
        if (!result) {
            // Si l'utilisateur n'existe pas, on renvoie la page de connexion avec une erreur
            res.send('Cet utilisateur n\'existe pas');
            return;
        }
        //Vérifier si le mot de passe est correct
        if (!bcrypt.compareSync(password, result.password)) {
            res.send('Le mot de passe est incorrect');
            return;
        }


        // Créer un token
        const token = jwt.sign({ _id: result._id, name : result.username}, process.env.TOKEN_SECRET, { expiresIn: '1h'});

        const maxAge = 1 * 60 * 60; // 1 heure en secondes

        // Créer un cookie
        res.cookie('jwt', token, { maxAge: maxAge * 1000 });

        res.redirect('/');
    });
}