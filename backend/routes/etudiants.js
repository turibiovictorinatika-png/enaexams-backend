const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Etudiant = require('../models/Etudiant');
const { envoyerCodeReinitialisation } = require('../utils/email');

// ── Middleware étudiant ou admin connecté ──
const authRequis = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ message: 'Non autorisé' });
  try {
    req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

// ── Middleware admin seulement ──
const adminRequis = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ message: 'Non autorisé' });
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    if (decoded.role !== 'admin')
      return res.status(403).json({ message: 'Accès réservé à l\'administration' });
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

// POST /api/etudiants/inscription
router.post('/inscription', async (req, res) => {
  try {
    const { nom, prenom, email, password, filiere, niveau } = req.body;

    if (!nom || !prenom || !email || !password)
      return res.status(400).json({ message: 'Tous les champs sont obligatoires' });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: 'Email invalide' });

    if (password.length < 6)
      return res.status(400).json({ message: 'Mot de passe trop court (6 caractères min)' });

    const existe = await Etudiant.findOne({ email });
    if (existe)
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });

    // ✅ Pas de bcrypt ici — le hook pre('save') du modèle s'en charge
    const etudiant = await Etudiant.create({
      nom, prenom, email, password, filiere, niveau
    });

    const token = jwt.sign(
      { id: etudiant._id, email: etudiant.email, nom: etudiant.nom, role: 'etudiant' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      nom: etudiant.nom,
      prenom: etudiant.prenom,
      email: etudiant.email
    });
  } catch (err) {
    console.error('POST /inscription :', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/etudiants/connexion
router.post('/connexion', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email et mot de passe requis' });

    const etudiant = await Etudiant.findOne({ email });

    // ✅ Message identique que l'email existe ou non (sécurité)
    if (!etudiant || !(await etudiant.comparePassword(password)))
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });

    const token = jwt.sign(
      { id: etudiant._id, email: etudiant.email, nom: etudiant.nom, role: 'etudiant' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      nom: etudiant.nom,
      prenom: etudiant.prenom,
      email: etudiant.email
    });
  } catch (err) {
    console.error('POST /connexion :', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/etudiants/profil
router.get('/profil', authRequis, async (req, res) => {
  try {
    const etudiant = await Etudiant.findById(req.user.id)
      .select('-password -resetCode -resetExpire');
    if (!etudiant)
      return res.status(404).json({ message: 'Compte introuvable' });
    res.json(etudiant);
  } catch (err) {
    console.error('GET /profil :', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/etudiants/liste — admin seulement
router.get('/liste', adminRequis, async (req, res) => {
  try {
    const etudiants = await Etudiant.find()
      .select('-password -resetCode -resetExpire')
      .sort({ createdAt: -1 });
    res.json(etudiants);
  } catch (err) {
    console.error('GET /liste :', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/etudiants/mot-de-passe-oublie
router.post('/mot-de-passe-oublie', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ message: 'Email requis' });

    const etudiant = await Etudiant.findOne({ email });

    // ✅ Ne pas révéler si l'email existe ou non
    if (!etudiant)
      return res.json({ message: 'Si cet email existe, un code a été envoyé.' });

    // ✅ Anti-spam : bloquer si un code récent existe déjà
    if (etudiant.resetExpire && etudiant.resetExpire > new Date()) {
      const restant = Math.ceil((etudiant.resetExpire - new Date()) / 60000);
      return res.status(429).json({
        message: `Un code a déjà été envoyé. Attendez ${restant} minute(s).`
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    etudiant.resetCode = code;
    etudiant.resetExpire = new Date(Date.now() + 15 * 60 * 1000);

    // ✅ isModified('password') sera false → pas de re-hashage du mot de passe
    await etudiant.save();

    const envoye = await envoyerCodeReinitialisation(email, etudiant.prenom, code);
    if (!envoye)
      return res.status(500).json({ message: "Erreur lors de l'envoi de l'email." });

    res.json({ message: 'Si cet email existe, un code a été envoyé.' });
  } catch (err) {
    console.error('POST /mot-de-passe-oublie :', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/etudiants/reinitialiser-mot-de-passe
router.post('/reinitialiser-mot-de-passe', async (req, res) => {
  try {
    const { email, code, nouveauMotDePasse } = req.body;

    if (!email || !code || !nouveauMotDePasse)
      return res.status(400).json({ message: 'Tous les champs sont requis.' });

    if (nouveauMotDePasse.length < 6)
      return res.status(400).json({ message: 'Mot de passe trop court (6 caractères min).' });

    const etudiant = await Etudiant.findOne({ email });
    if (!etudiant)
      return res.status(404).json({ message: 'Compte introuvable.' });

    if (!etudiant.resetCode || etudiant.resetCode !== code)
      return res.status(400).json({ message: 'Code incorrect.' });

    if (new Date() > etudiant.resetExpire)
      return res.status(400).json({ message: 'Code expiré. Demandez un nouveau code.' });

    // ✅ Assignation directe — le hook pre('save') hashera automatiquement
    etudiant.password = nouveauMotDePasse;
    etudiant.resetCode = null;
    etudiant.resetExpire = null;
    await etudiant.save();

    res.json({ message: 'Mot de passe mis à jour avec succès.' });
  } catch (err) {
    console.error('POST /reinitialiser-mot-de-passe :', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE /api/etudiants/:id — admin seulement
router.delete('/:id', adminRequis, async (req, res) => {
  try {
    const etudiant = await Etudiant.findByIdAndDelete(req.params.id);
    if (!etudiant)
      return res.status(404).json({ message: 'Étudiant introuvable.' });
    res.json({ message: 'Étudiant supprimé' });
  } catch (err) {
    console.error('DELETE /etudiants/:id :', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;