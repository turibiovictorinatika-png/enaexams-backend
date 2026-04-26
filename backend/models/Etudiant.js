const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const EtudiantSchema = new mongoose.Schema({
  nom:      { type: String, required: true, trim: true },
  prenom:   { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  filiere:  { type: String, default: '' },
  niveau:   { type: String, default: '' },
  createdAt:{ type: Date, default: Date.now },
resetCode:   { type: String, default: null },
  resetExpire: { type: Date, default: null },
});

EtudiantSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

EtudiantSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('Etudiant', EtudiantSchema);