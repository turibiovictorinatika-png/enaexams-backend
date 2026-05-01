const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const NOUVEAU_USERNAME = 'Admin1984';   // ← votre identifiant
const NOUVEAU_PASSWORD = '@ENA2026';  // ← votre mot de passe

mongoose.connect(process.env.MONGO_URI)  // ← MONGO_URI et non MONGODB_URI
  .then(async () => {
    console.log('✅ Connecté à MongoDB');

    // Supprimer tous les anciens admins
    await Admin.deleteMany({});
    console.log('🗑️ Anciens admins supprimés');

    // Créer un nouvel admin propre
    const admin = new Admin({
      username: NOUVEAU_USERNAME,
      password: NOUVEAU_PASSWORD
    });
    await admin.save(); // bcrypt hash automatiquement

    console.log('✅ Nouvel admin créé avec succès');
    console.log('👤 Username :', NOUVEAU_USERNAME);
    console.log('🔐 Mot de passe hashé correctement');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur :', err.message);
    process.exit(1);
  });