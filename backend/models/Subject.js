const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  titre:    { type: String, required: true, trim: true },
  filiere:  { type: String, required: true, trim: true },
  niveau:   { type: String, required: true, enum: ['L1','L2','L3','M1','M2'] },
  matiere:  { type: String, required: true, trim: true },
  annee:    { type: String, required: true, trim: true },
  type:     { type: String, default: 'Examen', enum: ['Examen','Devoir','TD','TP','Rattrapage'] },
  fichier:  { type: String, default: null }, // filename in /uploads
  createdAt:{ type: Date, default: Date.now },
});

SubjectSchema.index({ titre: 'text', matiere: 'text', filiere: 'text' });

module.exports = mongoose.model('Subject', SubjectSchema);
