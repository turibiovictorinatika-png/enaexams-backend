const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Subject = require('../models/Subject');
const auth = require('../middleware/auth');

// ─── Multer config ───
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Seuls les fichiers PDF sont acceptés'));
  },
});

// ─── GET /api/subjects — public ───
router.get('/', async (req, res) => {
  try {
    const { q, filiere, niveau, matiere, annee, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (filiere) filter.filiere = filiere;
    if (niveau)  filter.niveau  = niveau;
    if (matiere) filter.matiere = new RegExp(matiere, 'i');
    if (annee)   filter.annee   = annee;
    if (q)       filter.$text   = { $search: q };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [subjects, total] = await Promise.all([
      Subject.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Subject.countDocuments(filter),
    ]);

    res.json({ subjects, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/subjects/:id — public ───
router.get('/:id', async (req, res) => {
  try {
    const s = await Subject.findById(req.params.id);
    if (!s) return res.status(404).json({ message: 'Sujet non trouvé' });
    res.json(s);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/subjects — admin only ───
router.post('/', auth, upload.single('fichier'), async (req, res) => {
  try {
    const { titre, filiere, niveau, matiere, annee, type } = req.body;
    if (!titre || !filiere || !niveau || !matiere || !annee)
      return res.status(400).json({ message: 'Champs obligatoires manquants' });

    const subject = await Subject.create({
      titre, filiere, niveau, matiere, annee, type,
      fichier: req.file ? req.file.filename : null,
    });
    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/subjects/:id — admin only ───
router.put('/:id', auth, upload.single('fichier'), async (req, res) => {
  try {
    const { titre, filiere, niveau, matiere, annee, type } = req.body;
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Sujet non trouvé' });

    if (req.file && subject.fichier) {
      const oldPath = path.join(__dirname, '../uploads', subject.fichier);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    Object.assign(subject, {
      titre: titre || subject.titre,
      filiere: filiere || subject.filiere,
      niveau: niveau || subject.niveau,
      matiere: matiere || subject.matiere,
      annee: annee || subject.annee,
      type: type || subject.type,
      ...(req.file && { fichier: req.file.filename }),
    });

    await subject.save();
    res.json(subject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/subjects/:id — admin only ───
router.delete('/:id', auth, async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Sujet non trouvé' });

    if (subject.fichier) {
      const filePath = path.join(__dirname, '../uploads', subject.fichier);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.json({ message: 'Sujet supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
