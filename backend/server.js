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
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ───
app.use('/api/auth', require('./routes/auth'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/etudiants', require('./routes/etudiants'));

// ─── Serve frontend in production ───
app.use(express.static(path.join(__dirname, '../frontend')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));

// ─── Create uploads dir ───
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ─── Connect DB & Start ───
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connecté');
    const PORT = process.env.PORT || 10000;
    app.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));
  })
  .catch(err => { console.error('❌ Erreur MongoDB:', err); process.exit(1); });
