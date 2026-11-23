# Guide de passage en production Google Play

## ❌ Pourquoi Google bloque le passage en production

Google Play exige depuis 2023 que les **nouvelles applications** passent par une période de test obligatoire avant d'accéder à la production :

- **Minimum 20 testeurs** ayant accepté de participer
- **Minimum 14 jours** de test continu
- Les testeurs doivent avoir **installé et utilisé** l'app

---

## ✅ Plan d'action étape par étape

### ÉTAPE 1 — Publier sur le track "Test fermé" (Closed Testing / Alpha)

Dans Google Play Console :

1. Va dans **Tests > Tests fermés > Gérer la piste Alpha**
2. Crée une liste d'e-mails de testeurs (minimum 20 personnes)
3. Upload ton AAB (Android App Bundle) sur ce track
4. Envoie le lien d'invitation à tes testeurs

```bash
# Builder l'AAB de production
eas build --platform android --profile production

# Soumettre sur le track alpha (test fermé)
eas submit --platform android --profile closed
```

### ÉTAPE 2 — Recruter 20 testeurs

Sources possibles :
- Membres de ton église / communauté MAGB
- Famille et amis
- Collègues développeurs
- Groupes Facebook/WhatsApp de testeurs d'apps

**Chaque testeur doit :**
1. Recevoir le lien d'invitation Google Play
2. Accepter de participer au test
3. Installer l'app depuis le Play Store (pas un APK direct)
4. Utiliser l'app au moins une fois

### ÉTAPE 3 — Attendre 14 jours

Google vérifie automatiquement :
- Que 20+ testeurs ont **opté** pour le test
- Que la période de 14 jours est écoulée
- Que l'app est stable (pas de crashes massifs)

### ÉTAPE 4 — Passer en production

Après 14 jours avec 20+ testeurs actifs :
1. Dans Google Play Console, le bouton "Promouvoir en production" sera débloqué
2. Clique sur **Promouvoir vers la production**
3. Choisis un déploiement progressif (10% → 50% → 100%)

```bash
# Soumettre en production
eas submit --platform android --profile production
```

---

## 📋 Checklist avant de soumettre

### Configuration technique
- [x] `eas.json` configuré avec les tracks internal/alpha/production
- [x] `app.json` avec `versionCode` incrémenté
- [x] Permissions Android avec le bon format (`android.permission.XXX`)
- [x] `intentFilters` pour le deep linking configuré
- [ ] Icône 512x512px (PNG, sans transparence)
- [ ] Screenshots pour toutes les tailles d'écran
- [ ] Bannière feature graphic 1024x500px

### Contenu Google Play Console
- [ ] Description courte (80 caractères max)
- [ ] Description longue (4000 caractères max)
- [ ] Politique de confidentialité (URL publique obligatoire)
- [ ] Catégorie de l'app (Lifestyle, Finance, etc.)
- [ ] Classification du contenu (questionnaire IARC)
- [ ] Pays de distribution

### Politique de confidentialité (OBLIGATOIRE)
Google exige une URL de politique de confidentialité accessible publiquement.

Exemple minimal à héberger sur ton site :
```
https://partenairemagb.com/privacy-policy
```

---

## 🔧 Commandes utiles

```bash
# 1. Builder pour le test interne (APK direct)
eas build --platform android --profile internal

# 2. Builder pour le test fermé (AAB pour Play Store)
eas build --platform android --profile production

# 3. Soumettre sur le track interne
eas submit --platform android --profile internal

# 4. Soumettre sur le track alpha (test fermé)
eas submit --platform android --profile closed

# 5. Voir le statut des builds
eas build:list

# 6. Voir le statut des soumissions
eas submit:list
```

---

## ⏱️ Timeline réaliste

| Jour | Action |
|------|--------|
| J+0 | Upload AAB sur track Alpha |
| J+0 | Envoyer invitations aux 20 testeurs |
| J+1 à J+3 | S'assurer que 20 testeurs ont accepté et installé |
| J+14 | Vérifier que le compteur Google est satisfait |
| J+15 | Promouvoir en production (déploiement 10%) |
| J+17 | Augmenter à 50% si pas de problèmes |
| J+20 | Déploiement 100% |

---

## ❓ FAQ

**Q: Puis-je utiliser des comptes Google fictifs comme testeurs ?**
Non. Google détecte les faux comptes. Utilise de vraies personnes.

**Q: Les testeurs doivent-ils utiliser l'app activement ?**
Ils doivent au minimum l'installer depuis le Play Store. L'utilisation active aide mais n'est pas strictement vérifiée.

**Q: Que se passe-t-il si j'ai moins de 20 testeurs après 14 jours ?**
Le bouton "Promouvoir en production" reste grisé. Tu dois atteindre 20 testeurs.

**Q: Puis-je utiliser le track "Test interne" pour les 20 testeurs ?**
Non. Le test interne (jusqu'à 100 testeurs) ne compte pas pour l'exigence. Il faut le track **Alpha (Test fermé)**.

**Q: Mon app a déjà été publiée avant, est-ce que ça s'applique ?**
Non, cette exigence ne s'applique qu'aux **nouvelles applications** jamais publiées en production.

---

## 🚨 Erreurs courantes à éviter

1. **Uploader un APK au lieu d'un AAB** — Google Play exige le format AAB depuis 2021
2. **Oublier d'incrémenter `versionCode`** — Chaque upload doit avoir un versionCode supérieur
3. **Politique de confidentialité inaccessible** — L'URL doit être publique et fonctionnelle
4. **Screenshots manquants** — Au moins 2 screenshots par type d'écran requis
5. **Utiliser le track "Interne" au lieu d'"Alpha"** — Seul Alpha compte pour les 20 testeurs

---

## 📞 Support

- Documentation EAS Submit : https://docs.expo.dev/submit/android/
- Google Play Console Help : https://support.google.com/googleplay/android-developer
- Politique de test Google : https://support.google.com/googleplay/android-developer/answer/14151465
