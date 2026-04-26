const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Etudiant = require('../models/Etudiant');
const { envoyerCodeReinitialisation } = require('../utils/email');

// POST /api/etudiants/inscription
router.post('/inscription', async (req, res) => {
  try {
    const { nom, prenom, email, password, filiere, niveau } = req.body;
    if (!nom || !prenom || !email || !password)
      return res.status(400).json({ message: 'Tous les champs sont obligatoires' });

    const existe = await Etudiant.findOne({ email });
    if (existe)
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });

    const etudiant = await Etudiant.create({ nom, prenom, email, password, filiere, niveau });

    const token = jwt.sign(
      { id: etudiant._id, email: etudiant.email, nom: etudiant.nom },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, nom: etudiant.nom, prenom: etudiant.prenom, email: etudiant.email });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// POST /api/etudiants/connexion
router.post('/connexion', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email et mot de passe requis' });

    const etudiant = await Etudiant.findOne({ email });
    if (!etudiant || !(await etudiant.comparePassword(password)))
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });

    const token = jwt.sign(
      { id: etudiant._id, email: etudiant.email, nom: etudiant.nom },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, nom: etudiant.nom, prenom: etudiant.prenom, email: etudiant.email });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// GET /api/etudiants/profil — étudiant connecté
router.get('/profil', async (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: 'Non autorisé' });
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const etudiant = await Etudiant.findById(decoded.id).select('-password');
    res.json(etudiant);
  } catch {
    res.status(401).json({ message: 'Token invalide' });
  }
});

// GET /api/etudiants/liste — admin seulement
router.get('/liste', async (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: 'Non autorisé' });
    jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const etudiants = await Etudiant.find().select('-password').sort({ createdAt: -1 });
    res.json(etudiants);
  } catch {
    res.status(401).json({ message: 'Non autorisé' });
  }
});

// POST /api/etudiants/mot-de-passe-oublie
router.post('/mot-de-passe-oublie', async (req, res) => {
  try {
    const { email } = req.body;
    const etudiant = await Etudiant.findOne({ email });
    if (!etudiant) return res.status(404).json({ message: 'Aucun compte avec cet email.' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date(Date.now() + 15 * 60 * 1000);

    etudiant.resetCode = code;
    etudiant.resetExpire = expiration;
    await etudiant.save();

    const envoye = await envoyerCodeReinitialisation(email, etudiant.prenom, code);
    if (!envoye) return res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email.' });

    res.json({ message: 'Code envoyé par email.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/etudiants/reinitialiser-mot-de-passe
router.post('/reinitialiser-mot-de-passe', async (req, res) => {
  try {
    const { email, code, nouveauMotDePasse } = req.body;
    const etudiant = await Etudiant.findOne({ email });
    if (!etudiant) return res.status(404).json({ message: 'Compte introuvable.' });
    if (!etudiant.resetCode || etudiant.resetCode !== code)
      return res.status(400).json({ message: 'Code incorrect.' });
    if (new Date() > etudiant.resetExpire)
      return res.status(400).json({ message: 'Code expiré. Demandez un nouveau code.' });
    if (nouveauMotDePasse.length < 6)
      return res.status(400).json({ message: 'Mot de passe trop court (6 caractères min).' });

    etudiant.password = nouveauMotDePasse;
    etudiant.resetCode = null;
    etudiant.resetExpire = null;
    await etudiant.save();

    res.json({ message: 'Mot de passe mis à jour avec succès.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;