const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: 'Champs requis manquants' });

    const admin = await Admin.findOne({ username });

    if (!admin || !(await admin.comparePassword(password)))
      return res.status(401).json({ message: 'Identifiants incorrects' });

    // FIX : ajout de role: 'admin' dans le token
    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || '8h' }
    );

    res.json({ token, username: admin.username });
  } catch (err) {
    console.error('POST /auth/login :', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ⛔ Route /seed supprimée — dangereuse en production
// Pour créer un admin, utilisez un script séparé exécuté une seule fois :
//
// node scripts/createAdmin.js
//
// Contenu de scripts/createAdmin.js :
// const bcrypt = require('bcrypt');
// const Admin = require('../models/Admin');
// const mongoose = require('mongoose');
// require('dotenv').config();
// mongoose.connect(process.env.MONGODB_URI).then(async () => {
//   const hash = await bcrypt.hash('VotreMotDePasseSecret', 12);
//   await Admin.create({ username: 'admin', password: hash });
//   console.log('Admin créé');
//   process.exit();
// });

module.exports = router;