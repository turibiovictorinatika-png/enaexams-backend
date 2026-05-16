// ─────────────────────────────────────────────
//  EduDocs — Backend API (Node.js + Express)
// ─────────────────────────────────────────────
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// ─── Middleware ───
app.use(cors());
app.options('*', cors());

app.options('*', cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ───
app.use('/api/auth', require('./routes/auth'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/etudiants', require('./routes/etudiants'));

// ─── Create uploads dir ───
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ─── Route téléchargement proxy PDF ───
app.get('/download', async (req, res) => {
  const { url } = req.query;
  if (!url || !url.startsWith('https://res.cloudinary.com')) {
    return res.status(400).json({ message: 'URL invalide' });
  }
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="sujet-ena.pdf"');
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Erreur download:', err.message);
    res.status(500).json({ message: 'Erreur téléchargement' });
  }
});

// ─── Route téléchargement proxy PDF ───
app.get('/download', async (req, res) => {
  const { url } = req.query;
  if (!url || !url.startsWith('https://res.cloudinary.com')) {
    return res.status(400).json({ message: 'URL invalide' });
  }
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="sujet-ena.pdf"');
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Erreur download:', err.message);
    res.status(500).json({ message: 'Erreur téléchargement' });
  }
});

// ─── Connect DB & Start ───
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connecté');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));
  })
  .catch(err => { console.error('❌ Erreur MongoDB:', err); process.exit(1); });