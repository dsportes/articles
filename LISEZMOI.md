git init 
git config credential.helper store

// Mettre les sources changés en stages
git commit -m "init"

git remote add origin https://github.com/dsportes/articles.git
git push -u origin master

## Socle pour créer rapidement une application quasar + electron

### Création de zéro
npm install -g @quasar/cli  
quasar create qe-base  
cd qe-base  
quasar mode add electron  
npm install -s electron-packager  

### Pour tester
quasar dev -m electron

### Pour faire un runtime
quasar build -m electron

### Options à ajuster

#### Dans src-electron/main-process/electron-main.js

// suppression du cadre
mainWindow = new BrowserWindow({
  frame: false,

if (process.env.PROD) {
    mainWindow.setMenu(null)
    mainWindow.setSimpleFullScreen(true)
  } else {
    mainWindow.maximize()
  }

#### Il faut laisser un router minimal 
Ne pas toucher à src/router  
Garder src/pages/Error404.vue et router (appelé par défaut)

### Dans quasar.conf.js
extendWebpack (cfg) {
        // ajouter
        cfg.devtool = 'source-map'

.eslintrc.js   // rules ajoutées en queue

      components: ['QDialog', 'QHeader', 'QFooter', 'QCard', 'QCardSection', 'QCardActions'],
      directives: ['ClosePopup'],

Dans packager : pour Windows mettre un .ico à la racine  
Dans build : mettre le nom de l'appli

### Dans src/assets
Le fichier app-logo-128pxx128px.png est le logo de l'application

### Dans package.json
Changer les informations d'identification  
Inscrire les modules requis  

### Dans index.template.html
Changer le cas échéant la taille des fontes : les CSS de l'application sont écrits en rem plutôt qu'en px

Terminer par : npm install  
