const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ message: 'Token manquant' });

  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};