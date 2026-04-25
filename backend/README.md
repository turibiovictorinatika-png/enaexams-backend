# 📚 EduDocs — Plateforme de Sujets d'Évaluation

Interface web moderne pour collecter, stocker et consulter des sujets d'examens, devoirs et TD.

---

## 🗂️ Structure du projet

```
school-platform/
├── frontend/
│   └── index.html          ← Application complète (standalone, sans backend)
├── backend/
│   ├── server.js           ← Point d'entrée Express
│   ├── package.json
│   ├── .env.example        ← Copier en .env
│   ├── models/
│   │   ├── Subject.js      ← Modèle MongoDB sujets
│   │   └── Admin.js        ← Modèle MongoDB administrateur
│   ├── routes/
│   │   ├── auth.js         ← POST /api/auth/login
│   │   ├── subjects.js     ← CRUD /api/subjects
│   │   └── stats.js        ← GET /api/stats
│   ├── middleware/
│   │   └── auth.js         ← Vérification JWT
│   ├── scripts/
│   │   └── seed.js         ← Initialisation DB
│   └── uploads/            ← Fichiers PDF uploadés (créé auto)
└── README.md
```

---

## 🗄️ Schéma de base de données MongoDB

### Collection `subjects`
| Champ      | Type    | Requis | Description                                      |
|------------|---------|--------|--------------------------------------------------|
| `_id`      | ObjectId| auto   | Identifiant unique                               |
| `titre`    | String  | ✅     | Titre du sujet                                   |
| `filiere`  | String  | ✅     | Filière (ex: Informatique)                       |
| `niveau`   | String  | ✅     | L1, L2, L3, M1, M2                              |
| `matiere`  | String  | ✅     | Nom de la matière                                |
| `annee`    | String  | ✅     | Année académique (ex: 2023-2024)                 |
| `type`     | String  |        | Examen / Devoir / TD / TP / Rattrapage           |
| `fichier`  | String  |        | Nom du fichier PDF dans /uploads                 |
| `createdAt`| Date    | auto   | Date d'ajout                                     |

### Collection `admins`
| Champ      | Type    | Requis | Description                   |
|------------|---------|--------|-------------------------------|
| `_id`      | ObjectId| auto   | Identifiant unique            |
| `username` | String  | ✅     | Identifiant de connexion      |
| `password` | String  | ✅     | Mot de passe hashé (bcrypt)   |

---

## 🚀 Option 1 — Version Frontend seule (sans backend)

Ouvrez simplement `frontend/index.html` dans votre navigateur.

- Données stockées dans `localStorage`
- Login : `admin` / `admin123`
- Upload PDF supporté (stocké en mémoire)
- Aucune installation requise ✅

---

## ⚙️ Option 2 — Version complète avec backend

### Prérequis
- Node.js 18+
- MongoDB (local ou Atlas)

### Installation

```bash
# 1. Cloner / placer le projet
cd school-platform/backend

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp ../.env.example .env
# Éditez .env avec votre URI MongoDB et votre JWT_SECRET

# 4. Initialiser la base de données (admin + données de démo)
npm run seed

# 5. Démarrer le serveur
npm run dev         # développement (nodemon, auto-reload)
# ou
npm start           # production
```

Le serveur démarre sur **http://localhost:5000**

---

## 📡 API Endpoints

### Authentification
| Méthode | Route               | Description                    | Auth |
|---------|---------------------|--------------------------------|------|
| POST    | /api/auth/login     | Connexion admin                | ❌   |
| POST    | /api/auth/seed      | Créer admin initial            | ❌   |

### Sujets
| Méthode | Route               | Description                    | Auth  |
|---------|---------------------|--------------------------------|-------|
| GET     | /api/subjects       | Liste avec filtres & pagination| ❌    |
| GET     | /api/subjects/:id   | Détail d'un sujet              | ❌    |
| POST    | /api/subjects       | Ajouter un sujet + PDF         | ✅ JWT|
| PUT     | /api/subjects/:id   | Modifier un sujet              | ✅ JWT|
| DELETE  | /api/subjects/:id   | Supprimer un sujet             | ✅ JWT|

### Paramètres GET /api/subjects
```
?q=algorithmique        recherche textuelle
&filiere=Informatique   filtre filière
&niveau=L2              filtre niveau
&matiere=Analyse        filtre matière
&annee=2023-2024        filtre année
&page=1                 pagination
&limit=20               nb résultats par page
```

### Stats (admin)
| Méthode | Route       | Description              | Auth  |
|---------|-------------|--------------------------|-------|
| GET     | /api/stats  | Tableau de bord chiffres | ✅ JWT|

---

## 🔒 Authentification

```javascript
// Login
const res = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' })
});
const { token } = await res.json();

// Utiliser le token
fetch('/api/subjects', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData  // FormData avec fichier PDF
});
```

---

## 📤 Upload PDF (exemple)

```javascript
const formData = new FormData();
formData.append('titre', 'Examen Analyse 1');
formData.append('filiere', 'Informatique');
formData.append('niveau', 'L1');
formData.append('matiere', 'Analyse mathématique');
formData.append('annee', '2023-2024');
formData.append('type', 'Examen');
formData.append('fichier', pdfFile);  // File object

const res = await fetch('/api/subjects', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
});
```

---

## 🌐 Déploiement

### Variables d'environnement en production
```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/edudocs
JWT_SECRET=un_secret_très_long_et_aléatoire
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://votredomaine.com
```

### Avec PM2
```bash
npm install -g pm2
pm2 start server.js --name edudocs
pm2 save
pm2 startup
```

---

## 🛠️ Tech Stack

| Couche      | Technologie        |
|-------------|--------------------|
| Frontend    | HTML5, CSS3, JS    |
| Backend     | Node.js + Express  |
| Base de données | MongoDB + Mongoose |
| Auth        | JWT + bcryptjs     |
| Upload      | Multer             |
| Dev         | Nodemon            |

---

## 👤 Identifiants par défaut

| Rôle  | Username | Password  |
|-------|----------|-----------|
| Admin | admin    | admin123  |

> ⚠️ **Changez le mot de passe en production !**
