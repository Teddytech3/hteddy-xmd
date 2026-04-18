# Utiliser l'image Node Alpine
FROM node:20-alpine

# Installer git et les outils nécessaires pour npm
RUN apk add --no-cache git bash

# Définir le dossier de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install --production

# Copier le reste de l'application
COPY . .

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=10000

# Exposer le port
EXPOSE 10000

# Lancer l'application
CMD ["node", "popkid.js"]
