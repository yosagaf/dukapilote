# DukaPilote - Gestion de Stock

Application de gestion de stock pour magasins développée avec React et Firebase.

## Fonctionnalités

- **Authentification** : Login admin et utilisateurs magasin
- **Gestion Inventaire** : Ajout, modification, suppression d'articles
- **Contrôle Stock** : Suivi des quantités et seuils minimums
- **Interface Admin** : Gestion des utilisateurs et magasins
- **Sidebar Navigation** : Interface moderne avec navigation latérale

## Technologies

- React + Vite
- Firebase (Auth + Firestore)
- Tailwind CSS v4
- Glassmorphism Design

## Installation

```bash
npm install
npm run dev
```


Maintenatn on a deux types de shop -> le dépot où on garde le stock et la dukani (boutique) pour un user shop.
Ce qui est cruciale si quelqu'un qui au dukani et qu'un article n'y est pas je dois etre en mesure de lui dire l'article est au depot.
Un dukani peut avoir 1 ou plusieurs depot.
ET si je prend un article au depot, je dois pouvoir dire dir s'il larticle est rajouter au dukani ou pas. mais on peut aussi retirer un article dans le depot mais pas rajouter au dukani si 
je prend larticle pour moi meme. donc peut etre qu'il faudras gere ça.

J'aimerais aussi qu'il y ai une barre de recherhce pour chercher un produit avec un suggestion d'article à mesure que que je tape.
