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

    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || '8h' }
    );

    res.json({ token, username: admin.username });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// POST /api/auth/seed — create initial admin (run once, then disable in production)
router.post('/seed', async (req, res) => {
  try {
    const exists = await Admin.findOne({ username: 'admin' });
    if (exists) return res.json({ message: 'Admin déjà créé' });
    await Admin.create({ username: 'admin', password: 'admin123' });
    res.json({ message: '✅ Admin créé (username: admin / password: admin123)' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
