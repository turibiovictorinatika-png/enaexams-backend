const router = require('express').Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Subject = require('../models/Subject');
const auth = require('../middleware/auth');

// ─── Configuration Cloudinary ───
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Multer + Cloudinary Storage ───
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'enaexams',
    allowed_formats: ['pdf'],
    resource_type: 'raw', // obligatoire pour les PDF
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
    const { q, filiere, niveau, matiere, annee, page = 1, limit = 200 } = req.query;
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

    // fichier = URL complète Cloudinary
    const fichierUrl = req.file ? req.file.path : null;

    const subject = await Subject.create({
      titre, filiere, niveau, matiere, annee, type,
      fichier: fichierUrl,
    });
    res.status(201).json(subject);
  } catch (err) {
    console.error('POST /subjects :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/subjects/:id — admin only ───
router.put('/:id', auth, upload.single('fichier'), async (req, res) => {
  try {
    const { titre, filiere, niveau, matiere, annee, type } = req.body;
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Sujet non trouvé' });

    // Supprimer l'ancien fichier sur Cloudinary si nouveau fichier uploadé
    if (req.file && subject.fichier) {
      try {
        // Extraire le public_id depuis l'URL Cloudinary
        const publicId = subject.fichier
          .split('/').slice(-2).join('/')
          .replace(/\.[^/.]+$/, '');
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
      } catch (e) {
        console.error('Erreur suppression Cloudinary:', e.message);
      }
    }

    Object.assign(subject, {
      titre:   titre   || subject.titre,
      filiere: filiere || subject.filiere,
      niveau:  niveau  || subject.niveau,
      matiere: matiere || subject.matiere,
      annee:   annee   || subject.annee,
      type:    type    || subject.type,
      ...(req.file && { fichier: req.file.path }),
    });

    await subject.save();
    res.json(subject);
  } catch (err) {
    console.error('PUT /subjects/:id :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/subjects/:id — admin only ───
router.delete('/:id', auth, async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Sujet non trouvé' });

    // Supprimer le fichier sur Cloudinary
    if (subject.fichier) {
      try {
        const publicId = subject.fichier
          .split('/').slice(-2).join('/')
          .replace(/\.[^/.]+$/, '');
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
      } catch (e) {
        console.error('Erreur suppression Cloudinary:', e.message);
      }
    }

    res.json({ message: 'Sujet supprimé' });
  } catch (err) {
    console.error('DELETE /subjects/:id :', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;