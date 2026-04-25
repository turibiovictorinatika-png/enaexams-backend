const router = require('express').Router();
const Subject = require('../models/Subject');
const Etudiant = require('../models/Etudiant');
const auth = require('../middleware/auth');

// GET /api/stats — admin dashboard
router.get('/', auth, async (req, res) => {
  try {
    const [total, filieres, matieres, annees, etudiants] = await Promise.all([
      Subject.countDocuments(),
      Subject.distinct('filiere'),
      Subject.distinct('matiere'),
      Subject.distinct('annee'),
      Etudiant.countDocuments(),
    ]);
    res.json({
      total,
      filieres: filieres.length,
      matieres: matieres.length,
      annees: annees.length,
      etudiants,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;