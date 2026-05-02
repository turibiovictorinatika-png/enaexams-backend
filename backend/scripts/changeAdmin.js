const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const NOUVEAU_USERNAME = 'Admin1984';        // ← votre identifiant
const NOUVEAU_PASSWORD = 'Admin2026';  // ← votre mot de passe

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connecté à MongoDB');

    // Trouver et mettre à jour directement
    const admin = await Admin.findOne({});
    
    if (!admin) {
      console.log('❌ Aucun admin trouvé');
      process.exit(1);
    }

    admin.username = NOUVEAU_USERNAME;
    admin.password = NOUVEAU_PASSWORD;
    await admin.save();

    console.log('✅ Admin mis à jour avec succès');
    console.log('👤 Username :', NOUVEAU_USERNAME);
    console.log('🔐 Mot de passe hashé correctement');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur :', err.message);
    process.exit(1);
  });