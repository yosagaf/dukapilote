# Système de Gestion des Crédits - DukaPilote

## Vue d'ensemble

Le système de gestion des crédits permet aux clients d'acheter des articles à crédit avec deux options de paiement :
- **Paiement partiel** : Le client paie une partie du montant au moment de l'achat
- **Aucun paiement initial** : Le client ne paie rien au moment de l'achat

## Fonctionnalités principales

### 1. Création de crédits
- **Informations client** : Nom, prénom, lieu de naissance, date de rendez-vous
- **Sélection d'articles** : Interface similaire au système de devis/factures
- **Gestion des montants** : Calcul automatique des totaux et restes à payer
- **Validation du stock** : Vérification et réduction automatique du stock

### 2. Gestion des paiements
- **Ajout de paiements** : Possibilité d'ajouter des paiements partiels
- **Historique des paiements** : Suivi de tous les paiements effectués
- **Calculs automatiques** : Mise à jour automatique des montants et statuts

### 3. Suivi et reporting
- **Statistiques en temps réel** : Total des crédits, montants payés, restes à payer
- **Filtres et recherche** : Par statut, nom de client, etc.
- **Tri des données** : Par date, montant, statut, etc.

## Structure des données

### Collection Firestore `credits`
```javascript
{
  id: string,
  customerName: string,           // Nom du client
  customerFirstName: string,       // Prénom du client
  birthPlace: string,             // Lieu de naissance
  appointmentDate: Date,         // Date de rendez-vous
  items: [                        // Articles du crédit
    {
      itemId: string,
      itemName: string,
      quantity: number,
      unitPrice: number,
      totalPrice: number
    }
  ],
  totalAmount: number,           // Montant total
  paidAmount: number,            // Montant payé
  remainingAmount: number,       // Reste à payer
  status: 'pending' | 'partial' | 'completed',  // Statut du crédit
  shopId: string,                // ID du magasin
  userId: string,                // ID de l'utilisateur
  payments: [                    // Historique des paiements
    {
      amount: number,
      date: Date,
      comments: string
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

## Composants créés

### 1. `CreditModal.jsx`
Modal principal pour créer un nouveau crédit avec 3 étapes :
- **Étape 1** : Informations client
- **Étape 2** : Sélection d'articles et montants
- **Étape 3** : Validation et confirmation

### 2. `AddItemToCreditModal.jsx`
Modal pour sélectionner des articles à ajouter au crédit
- Interface de recherche et filtrage
- Sélection multiple d'articles
- Vérification du stock disponible

### 3. `PaymentModal.jsx`
Modal pour ajouter un paiement à un crédit existant
- Saisie du montant et de la date
- Commentaires optionnels
- Validation des montants

### 4. `CreditDetailsModal.jsx`
Modal pour afficher les détails complets d'un crédit
- Informations client et articles
- Historique des paiements
- Actions (ajouter paiement, clôturer)

### 5. `CreditsList.jsx`
Composant de liste des crédits avec :
- Tableau avec tri par colonnes
- Filtres par statut
- Recherche par nom de client
- Actions sur chaque crédit

### 6. `Credits.jsx`
Page principale du système de crédits
- Statistiques en temps réel
- Interface de gestion complète

## Services et utilitaires

### 1. `CreditService.js`
Service principal pour la gestion des crédits :
- `createCredit()` : Créer un nouveau crédit
- `getCredits()` : Récupérer les crédits avec filtres
- `addPayment()` : Ajouter un paiement
- `updateCredit()` : Mettre à jour un crédit
- `closeCredit()` : Clôturer un crédit
- `getCreditStats()` : Récupérer les statistiques
- `validateStock()` : Vérifier le stock disponible
- `updateStock()` : Réduire le stock après validation

### 2. `CreditStorage.js`
Gestion du stockage et du cache :
- Cache local pour les performances
- Validation des données
- Export CSV
- Gestion des erreurs

## Intégration dans l'application

### 1. Routes
- **Route** : `/credits`
- **Composant** : `Credits.jsx`
- **Protection** : Accessible aux utilisateurs non-admin uniquement

### 2. Navigation
- **Sidebar** : Nouvel élément "Crédits" après "Devis & Factures"
- **Icône** : Icône de crédit personnalisée
- **Position** : Accessible aux utilisateurs de magasin uniquement

### 3. Règles Firestore
```javascript
// Credits collection
match /credits/{creditId} {
  allow read, create: if isAuthenticated();
  allow update, delete: if isAuthenticated();
}
```

## Workflow d'utilisation

### 1. Création d'un crédit
1. L'utilisateur clique sur "Nouveau Crédit"
2. Saisie des informations client
3. Sélection des articles depuis l'inventaire
4. Définition des quantités et prix
5. Saisie du montant payé (optionnel)
6. Validation et création du crédit
7. Réduction automatique du stock

### 2. Gestion des paiements
1. Affichage de la liste des crédits
2. Clic sur "Ajouter un paiement" pour un crédit
3. Saisie du montant et des informations
4. Validation et mise à jour du crédit
5. Mise à jour automatique du statut

### 3. Suivi des crédits
1. Consultation des statistiques globales
2. Filtrage par statut ou recherche par client
3. Tri des données par différentes colonnes
4. Consultation des détails d'un crédit
5. Clôture des crédits entièrement payés

## Points techniques importants

### 1. Gestion du stock
- **Vérification** : Avant création du crédit
- **Réduction** : Après validation du crédit
- **Gestion d'erreurs** : Si stock insuffisant

### 2. Calculs automatiques
- **Montant total** : Somme des prix des articles
- **Reste à payer** : Total - Montant payé
- **Statut** : Automatique selon les montants

### 3. Validation des données
- **Champs obligatoires** : Nom, prénom, lieu de naissance
- **Montants** : Positifs et cohérents
- **Stock** : Disponibilité vérifiée

### 4. Performance
- **Cache local** : Pour les données fréquemment utilisées
- **Tri côté client** : Pour une meilleure réactivité
- **Pagination** : Pour les grandes listes (à implémenter si nécessaire)

## Sécurité

### 1. Authentification
- Tous les utilisateurs authentifiés peuvent créer des crédits
- Les crédits sont liés au magasin de l'utilisateur

### 2. Validation
- Vérification du stock avant création
- Validation des montants et données
- Gestion des erreurs

### 3. Audit
- Historique des paiements
- Timestamps de création et modification
- Traçabilité des actions

## Évolutions possibles

### 1. Fonctionnalités avancées
- **Rappels automatiques** : Notifications pour les paiements en retard
- **Rapports détaillés** : Export PDF des crédits
- **Historique client** : Suivi des crédits par client
- **Paiements échelonnés** : Planification des paiements

### 2. Améliorations techniques
- **Pagination** : Pour les grandes listes
- **Recherche avancée** : Filtres multiples
- **Notifications** : Alertes en temps réel
- **Synchronisation** : Mise à jour automatique

## Conclusion

Le système de gestion des crédits est maintenant entièrement intégré dans DukaPilote et permet une gestion complète des ventes à crédit avec un suivi précis des paiements et des statistiques en temps réel.
