const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const NOUVEAU_USERNAME = 'Admin1984';
const NOUVEAU_PASSWORD = 'ENA2026'; // ← votre vrai mot de passe

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connecté à MongoDB');

    // Hash manuel — contourne le hook pre('save')
    const hash = await bcrypt.hash(NOUVEAU_PASSWORD, 12);
    
    // Mise à jour directe sans passer par Mongoose
    const result = await mongoose.connection.collection('admins').updateOne(
      {}, // premier admin trouvé
      { $set: { 
          username: NOUVEAU_USERNAME, 
          password: hash 
        } 
      }
    );

    if (result.modifiedCount === 1) {
      console.log('✅ Admin mis à jour avec succès');
      console.log('👤 Username :', NOUVEAU_USERNAME);
      console.log('🔐 Hash :', hash.substring(0, 20) + '...');
    } else {
      console.log('❌ Aucun admin modifié');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur :', err.message);
    process.exit(1);
  });