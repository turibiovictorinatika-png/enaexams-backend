// scripts/seed.js — Initialise la base de données avec des données de démonstration
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Subject = require('../models/Subject');

const sampleSubjects = [
  { titre: "Examen final — Analyse Mathématique 1", filiere: "Informatique", niveau: "L1", matiere: "Analyse mathématique", annee: "2023-2024", type: "Examen" },
  { titre: "Devoir surveillé — Programmation orientée objet", filiere: "Informatique", niveau: "L2", matiere: "POO Java", annee: "2023-2024", type: "Devoir" },
  { titre: "TD — Algorithmique et structures de données", filiere: "Informatique", niveau: "L2", matiere: "Algorithmique", annee: "2022-2023", type: "TD" },
  { titre: "Examen final — Électromagnétisme", filiere: "Physique", niveau: "L2", matiere: "Électromagnétisme", annee: "2023-2024", type: "Examen" },
  { titre: "Rattrapage — Analyse 2", filiere: "Mathématiques", niveau: "L2", matiere: "Analyse 2", annee: "2022-2023", type: "Rattrapage" },
  { titre: "Examen — Bases de données relationnelles", filiere: "Informatique", niveau: "L3", matiere: "Bases de données", annee: "2023-2024", type: "Examen" },
  { titre: "TP — Réseaux informatiques", filiere: "Informatique", niveau: "L3", matiere: "Réseaux", annee: "2022-2023", type: "TP" },
  { titre: "Examen — Économétrie appliquée", filiere: "Économie", niveau: "L3", matiere: "Économétrie", annee: "2023-2024", type: "Examen" },
  { titre: "Devoir — Thermodynamique", filiere: "Physique", niveau: "L1", matiere: "Thermodynamique", annee: "2023-2024", type: "Devoir" },
  { titre: "Examen final — Intelligence artificielle", filiere: "Informatique", niveau: "M1", matiere: "Intelligence artificielle", annee: "2023-2024", type: "Examen" },
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connecté à MongoDB');

    // Admin
    const adminExists = await Admin.findOne({ username: 'admin' });
    if (!adminExists) {
      await Admin.create({ username: 'admin', password: 'admin123' });
      console.log('✅ Administrateur créé: admin / admin123');
    } else {
      console.log('ℹ️  Admin déjà existant');
    }

    // Sujets
    await Subject.deleteMany({});
    await Subject.insertMany(sampleSubjects);
    console.log(`✅ ${sampleSubjects.length} sujets insérés`);

    process.exit(0);
  })
  .catch(err => { console.error('❌', err); process.exit(1); });
