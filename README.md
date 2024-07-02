### Kafka TP - Guide d'Utilisation

Ce guide vous explique comment configurer et démarrer l'application Kafka Project.  
Suivez les étapes ci-dessous pour installer Kafka, démarrer l'application.

---

### Clonage du Répertoire

Clonez le repository depuis GitHub :

```bash
git clone https://github.com/EFREI-M1-Dev/Kafka-Project-Fredray-21.git
```

Aller dans le dossier du project:
```bash
cd Kafka-Project-Fredray-21
```

Exécuter Docker
```bash
docker compose up -d
```

# Démarrer le serveur / producer / consumer 
- http://localhost:80/
```bash
npm install
npm run start:prod
```



## Note :
Les fichiers `.env` ont été poussés sur le dépôt pour simplifier le rendu.
Il est évident qu'il est préférable d'éviter de faire cela dans les projets.


## Explication du Projet
Le projet Kafka permet de traquer les données météorologiques de différentes villes en temps réel. Voici les fonctionnalités principales :

- Ajout de villes à suivre :
  - Lorsqu'une ville est ajoutée, un producer Kafka est créé pour cette ville spécifique.
  - Le producer est responsable de récupérer périodiquement les données météorologiques de la ville et de les envoyer au topic Kafka.  

- Production et consommation des données météorologiques :
  - Les données sont récupérées via une API météo et envoyées au topic Kafka toutes les 5 secondes. Pour des besoins de rendu et de visualisation, cet intervalle est configuré à 5 secondes, mais il peut être modifié pour des intervalles plus longs, comme une heure.
  - Les consumers Kafka écoutent les messages sur le topic et peuvent les utiliser pour différentes tâches, comme afficher les données en temps réel ou les stocker dans une base de données.


# Illustrations :

## Website

![illustration](https://github.com/EFREI-M1-Dev/Kafka-Project-Fredray-21/blob/main/illustrationReadme/illustration.png?raw=true)

## Topic on Kafdrop

![illustration](https://github.com/EFREI-M1-Dev/Kafka-Project-Fredray-21/blob/main/illustrationReadme/topic.png?raw=true)

## Base de donnée

![illustration](https://github.com/EFREI-M1-Dev/Kafka-Project-Fredray-21/blob/main/illustrationReadme/bdd.png?raw=true)


## Logs

![illustration](https://github.com/EFREI-M1-Dev/Kafka-Project-Fredray-21/blob/main/illustrationReadme/logs.png?raw=true)