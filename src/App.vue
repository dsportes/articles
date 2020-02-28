<template>
   <q-layout id="q-app" view="hHh lpR fFf" class="text-grey-3 bg-green-10">
    <q-header elevated>
      <q-toolbar class="row q-py-md bg-black text-white">
        <q-btn :size="standardBtnSize" flat round @click="panneauGauche = true" icon="menu" color="grey-2" aria-label="Menu"/>
        <q-toolbar-title>
          Mise à jour des articles sur les balances
        </q-toolbar-title>
        <q-btn :size="standardBtnSize" flat @click="panneauFichiers()" icon="folder_open" label="Fichiers" color="grey-2" aria-label="Menu"/>
      </q-toolbar>
      <q-toolbar v-if="fichier" class="col row q-py-sm bg-blue-10 text-white">
        <q-toolbar-title>{{ fichier.label  }}</q-toolbar-title>
        <q-btn class="q-mx-xs" :size="standardBtnSize" color="primary" text-color="white" @click="ajouterArticle()" icon="add_circle">Ajouter<br>un article</q-btn>
        <q-btn class="q-mx-xs" :size="standardBtnSize" color="white" text-color="blue-10" @click="enreg = true" icon="check_circle">Enregistrer<br>comme modèle</q-btn>
        <q-btn class="q-mx-xs" :size="standardBtnSize" color="white" text-color="blue-10" @click="envoyer()" icon="send">Envoyer<br>aux balances</q-btn>
        <q-btn v-if="fichier && fichier.nom && !fichier.arch" class="q-mx-xs" :size="standardBtnSize" color="negative" text-color="white" @click="detruiremodele = true" icon="delete">Supprimer<br>ce modèle</q-btn>
      </q-toolbar>
      <div v-if="fichier" class="col row justify-center items-center q-gutter-md q-pa-sm bg-grey-9">
        <q-select style="min-width:10rem" color="black" bg-color="grey-1" filled bottom-slots v-model="tri" :options="optionsTri" label="Critère de tri" dense options-dense >
          <template v-slot:prepend>
            <q-icon name="sort" @click.stop />
          </template>
        </q-select>
        <q-select style="min-width:25rem" color="black" bg-color="grey-1" filled bottom-slots v-model="filtre" :options="optionsFiltre" label="Critère de filtre" dense options-dense >
          <template v-slot:prepend>
            <q-icon name="filter_list" @click.stop />
          </template>
        </q-select>
        <q-input style="min-width:6rem;position:relative;top:-0.9rem" color="black" bg-color="grey-1" dense filled v-model="argFiltre" label="argument ..."/>
      </div>
    </q-header>

    <q-drawer v-model="panneauGauche" elevated overlay :width="500" bordered content-dense>
      <q-btn v-if="panneauGauche" class="btnfermer btnfermerg" @click="panneauGauche = false" :size="standardBtnSize" round unelevated color="accent" icon="chevron_left"/>
      <q-list>
        <q-item clickable v-ripple class="column zoneErr">
          <div v-if="this.articles.length == 0" class="col">Pas d'article</div>
          <div v-else class="col">{{this.articles.length}} articles</div>
        </q-item>
        <q-separator />
        <q-item clickable class="bg-grey-1" v-ripple @click="exitApp = true">
          <q-item-section avatar><q-icon class="menuButton negative" :name="'exit_to_app'"/></q-item-section>
          <q-item-section class="menuText negative">Quitter l'application</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-drawer v-model="panneauDroit" side="right" elevated overlay :width="400" bordered content-dense>
     <q-btn  v-if="panneauDroit" class="btnfermer btnfermerd" @click="panneauDroit = false" :size="standardBtnSize" round unelevated color="accent" icon="chevron_right"/>
      <q-scroll-area class="fit">
        <q-list>
          <q-item clickable class="bg-grey-1" v-ripple @click="ouvrirFichier()">
            <q-item-section avatar><q-icon class="menuButton" :name="'today'"/></q-item-section>
            <q-item-section class="menuText primary">En service sur les balances</q-item-section>
          </q-item>
         <q-item clickable class="bg-grey-1" v-ripple @click="ouvrirODOO()">
            <q-item-section avatar><q-icon class="menuButton" :name="'cloud_download'"/></q-item-section>
            <q-item-section class="menuText">Importation depuis ODOO</q-item-section>
          </q-item>
         <q-item clickable class="bg-grey-1" v-ripple @click="fichierlocal = true;fichierImport = null;panneauDroit = false">
            <q-item-section avatar><q-icon class="menuButton" :name="'add_box'"/></q-item-section>
            <q-item-section class="menuText">Importer un fichier local comme modèle</q-item-section>
          </q-item>
         <q-item clickable class="bg-grey-1" v-ripple @click="panneauDroit = false;nouveauFichier()">
            <q-item-section avatar><q-icon class="menuButton" :name="'add_box'"/></q-item-section>
            <q-item-section class="menuText">Nouveau modèle</q-item-section>
          </q-item>
          <q-separator />
          <q-item class="column">
            <div v-if="this.lstArch.length == 0" class="col-auto titre1">Pas de mise à jour archivées</div>
            <div v-else>
              <div class="col-auto titre1">Dernières mises à jour</div>
              <div class="col-auto fichier" v-for="f in lstArch" :key="f" @click="ouvrirFichier(f,true)">{{ f }}</div>
            </div>
          </q-item>
          <q-separator />
          <q-item class="column">
            <div v-if="this.lstMod.length == 0" class="col-auto titre1">Pas de modèles enregistrés</div>
            <div v-else>
              <div class="col-auto titre1">Modèles enregistrés</div>
              <div class="col-auto fichier" v-for="f in lstMod" :key="f" @click="ouvrirFichier(f)">{{ f }}</div>
            </div>
          </q-item>
          <q-separator />
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <div v-if="selArticles.length === 0" class="pasArticles" style="height:100vh;margin-top:40vh">
        {{ chargement ? 'Chargement en cours ...' : 'Pas d\'articles' }}
      </div>
      <div v-else style="width:100%">
        <div v-for="(a, index) in selArticles" :key="index" @click="clicArticle(a, index)">
          <carte-article :article="a"></carte-article>
        </div>
      </div>
    </q-page-container>

    <q-footer elevated class="q-py-md bg-black text-white status">
      <div v-if="!fichier || !articles.length">0 article</div>
      <div v-else class="row">
        <div class="q-px-xs">{{ articles.length }} article(s) - </div>
        <div class="q-px-xs">{{ selArticles.length }} article(s) filtrés - </div>
        <div v-if="fichier.nbcrees !== 0" class="q-px-xs">{{ fichier.nbcrees }} créé(s) - </div>
        <div v-if="fichier.nbmodifies !== 0" class="q-px-xs">{{ fichier.nbmodifies }} modifié(s) - </div>
        <div v-if="fichier.nbsupprimes !== 0" class="q-px-xs">{{ fichier.nbsupprimes }} supprimé(s) - </div>
        <div v-if="fichier.nberreurs !== 0" class="q-px-xs artErr">{{ fichier.nberreurs }} en erreur(s) - </div>
        <div v-if="fichier.doublons.length !== 0" class="q-px-xs artErr">{{ fichier.doublons.length }} doublon(s) de code article - </div>
      </div>
    </q-footer>

    <q-dialog v-model="enreg" class="modeleDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Enregistrement comme modèle</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input v-model="nomModele"
            label="Nom du modèle"
            clearable
            clear-icon="close"
            :rules="[ val => b64u(val, 4, 32) || 'De 4 à 32 minuscules (a-z), majuscules (A-Z), chiffres (0-9), tiret (-), tiret bas (_)']"
            >
            <template v-slot:hint>
            De 4 à 32 minuscules (a-z), majuscules (A-Z), chiffres (0-9), tiret (-), tiret bas (_)
            </template>
          </q-input>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn size="1.5rem" label="Annuler" color="negative" v-close-popup />
          <q-btn size="1.5rem" label="Valider" :disable="!b64u(nomModele, 4, 32)" color="positive" @click="enregModele()" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="fichierlocal" class="modeleDialog">
      <q-card>
        <q-card-section>
          <q-file v-model="fichierImport" label="Choisir le fichier à importer" style="width:30rem;"/>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn size="1.5rem" flat label="Je renonce" color="negative" v-close-popup />
        </q-card-actions>
     </q-card>
    </q-dialog>

    <q-dialog v-model="envoye">
      <q-card>
        <q-card-section>
          <div class="text-h6">Envoi du fichier</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div v-if="dhArchivage">Le fichier a été envoyé aux balances, sauvé et archivé sous le nom {{ dhArchivage }}</div>
          <div v-else>Le fichier est sauvé mais n'a pas été envoyé aux balances qui l'ont déjà reçu avec le même contenu.</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn size="1.5rem" flat label="J'ai lu" color="negative" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="alerte">
      <q-card>
        <q-card-section>
          <div class="text-h6">Erreur</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          {{ texteAlerte }}
        </q-card-section>
        <q-card-actions align="right">
          <q-btn size="1.5rem" flat label="J'ai lu" color="negative" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="info">
      <q-card>
        <q-card-section>
          <div class="text-h6">Information</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          {{ texteAlerte }}
        </q-card-section>
        <q-card-actions align="right">
          <q-btn size="1.5rem" flat label="J'ai lu" color="positive" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="exitApp" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="exit_to_app" color="negative" text-color="white"/>
          <span class="q-ml-sm dialogText">Voulez-vous vraiment quitter l'application ?</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn :size="largeBtnSize" class="dialogText" flat label="Non, je la garde active" color="primary" v-close-popup
            @click="exitApp = false; panneauGauche = false"/>
          <q-btn :size="largeBtnSize" class="dialogText" flat label="Oui, je l'arrête" color="negative" v-close-popup
            @click="quit()"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="perdreModif" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="block" color="negative" text-color="white"/>
          <span class="q-ml-sm dialogText">Le fichier affiché a été modifié et n'a pas été sauvé comme modèle ni mis en service. Voulez-vous vraiment perdre les changements ?</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn :size="largeBtnSize" class="dialogText" flat label="Non, je le garde ouvert" color="primary" v-close-popup
            @click="perdreModif = false;resolveFichier(false)"/>
          <q-btn :size="largeBtnSize" class="dialogText" flat label="Oui, je perd les modifications" color="negative" v-close-popup
            @click="perdreModif = false;resolveFichier(true)"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="detruiremodele" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="block" color="negative" text-color="white"/>
          <span class="q-ml-sm dialogText">Voulez-vous vraiment détruire le modèle [{{ fichier ? fichier.nom : '?' }}] ?</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn :size="largeBtnSize" class="dialogText" flat label="Non, je le garde" color="primary" v-close-popup
            @click="detruiremodele = false"/>
          <q-btn :size="largeBtnSize" class="dialogText" flat label="Oui, je le détruis" color="negative" v-close-popup
            @click="detruiremodele = false;detruire()"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="envoyerfichier" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="block" color="negative" text-color="white"/>
          <span v-if="fichier && fichier.nom ? true : false" class="q-ml-sm dialogText">Voulez-vous vraiment envoyer ce fichier [{{ fichier.nom }}] aux balances ?</span>
          <span v-else class="q-ml-sm dialogText">Voulez-vous vraiment envoyer ce fichier aux balances ?</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn :size="largeBtnSize" class="dialogText" flat label="Non, je ne l'envoie pas" color="primary" v-close-popup
            @click="envoyerfichier = false"/>
          <q-btn :size="largeBtnSize" class="dialogText" flat label="Oui, je l'envoie aux balances" color="negative" v-close-popup
            @click="envoyerfichier = false;envoyer2()"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <fiche-article></fiche-article>
   </q-layout>
</template>

<script>
import { global, b64u, removeDiacritics } from './app/global'
import { config } from './app/config'
import { Fichier, listeArchMod, copieFichier, colonnes, defVal, decore } from './app/fichier'
import CarteArticle from './components/CarteArticle.vue'
import FicheArticle from './components/FicheArticle.vue'

const optionsFiltre = [
  'Tous',
  'En erreur',
  'Bio',
  'Non bio',
  'A l\'unité',
  'A l\'unité AVEC le poids à la pièce',
  'A l\'unité SANS le poids à la pièce',
  'Au Kg',
  'Sans image',
  'Avec image de largeur > à ...',
  'Dont le code commence par ...',
  'Dont le code barre commence par ...',
  'Dont le code court est ...',
  'Dont le nom contient ...',
  'Dont le nom commence par ...',
  'Créés',
  'Modifiés',
  'Supprimés',
  'Inchangés',
  'Doublons de code article'
]

export default {
  name: 'App',

  components: { CarteArticle, FicheArticle },

  async mounted() {
    global.appVue = this
    this.fichier = new Fichier()
    try {
      this.chargement = true
      this.articles = await this.fichier.lire()
      this.selArticles = []
      for (let i = 0, a = null; (a = this.articles[i]); i++) { this.selArticles.push(a) }
      this.chargement = false
    } catch (e) {
      this.chargement = false
      this.erreur('Le fichier des articles [articles.csv] est corrompu ou inaccessible.', e.message)
    }
  },

  data () {
    return {
      chargement: false,
      fichier: null,
      modifie: false,
      lstArch: [],
      lstMod: [],
      largeBtnSize: '1.5rem',
      standardBtnSize: '1rem',
      panneauGauche: false,
      panneauDroit: false,
      perdreModif: false,
      detruiremodele: false,
      envoyerfichier: false,
      fichierlocal: false,
      envoye: false,
      exitApp: false,
      alerte: false,
      info: false,
      enreg: false,
      dhArchivage: '',
      texteAlerte: '',
      fichierImport: null,
      articles: [],
      selArticles: [],
      index: 0,
      position: 0,
      nomModele: '',
      tri: 'Numéro de ligne',
      itri: 0,
      optionsTri: ['Numéro de ligne', 'Code de l\'article', 'Nom (alphabétique)', 'Code barre', 'Code court à 2 lettres'],
      filtre: 'Tous',
      ifilre: 0,
      optionsFiltre: optionsFiltre,
      argFiltre: ''
    }
  },

  watch: {
    fichierImport (apres) {
      this.fichierlocal = false
      if (apres) {
        this.importFichier(apres.name, apres.path)
        this.fichierImport = null
      }
    },
    tri (option, avant) {
      this.itri = this.optionsTri.indexOf(option)
      if (this.itri !== -1 && option !== avant) { this.trier() }
    },
    filtre (option, avant) {
      this.ifiltre = this.optionsFiltre.indexOf(option)
      if (this.ifiltre !== -1 && option !== avant) { this.filtrer() }
    },
    argFiltre (option, avant) {
      if (option !== avant) { this.filtrer() }
    }
  },

  methods: {
    quit () { config.quit() },

    b64u (val) { return b64u(val, 4, 32) },

    trier () {
      let c = this.itri
      // optionsTri: ['Numéro de ligne', 'Code de l\'article', 'Nom (alphabétique)', 'Code barre', 'Code court à 2 lettres']
      switch (c) {
        case 0 : { this.selArticles.sort((a, b) => { return a.n > b.n ? 1 : (a.n < b.n ? -1 : 0) }); break }
        case 1 : { this.selArticles.sort((a, b) => { return a.id > b.id ? 1 : (a.id < b.id ? -1 : 0) }); break }
        case 2 : { this.selArticles.sort((a, b) => { return a.nom > b.nom ? 1 : (a.nom < b.nom ? -1 : 0) }); break }
        case 3 : { this.selArticles.sort((a, b) => { return a['code-barre'] > b['code-barre'] ? 1 : (a['code-barre'] < b['code-barre'] ? -1 : 0) }); break }
        case 4 : { this.selArticles.sort((a, b) => { return a.codeCourt > b.codeCourt ? 1 : (a.codeCourt < b.codeCourt ? -1 : 0) }) }
      }
    },

    filtrer () {
      /*
      0 'Tous',
      1 'En erreur',
      2 'Bio',
      3 'Non bio',
      4 'A l\'unité',
      5 'A l\'unité AVEC le poids à la pièce',
      6 'A l\'unité SANS le poids à la pièce',
      7 'Au Kg',
      8 'Sans image',
      9 'Avec image de largeur > à ...',
      10 'Dont le code commence par ...',
      11 'Dont le code barre commence par ...',
      12 'Dont le code court est ...',
      13 'Dont le nom contient ...',
      14 'Dont le nom commence par ...',
      15 'Créés',
      16 'Modifiés',
      17 'Supprimés'
      18 'Inchangés'
      19 : 'Doublons de code article'
      */
      let c = this.ifiltre
      let n = parseInt(this.argFiltre)
      if (isNaN(n)) { n = 0 }
      let p = this.argFiltre || ''
      let P = removeDiacritics(p.toUpperCase())
      let s = this.articles
      switch (c) {
        case 0 : { this.selArticles = s.filter(a => true); break }
        case 1 : { this.selArticles = s.filter(a => a.erreurs.length !== 0); break }
        case 2 : { this.selArticles = s.filter(a => a.bio); break }
        case 3 : { this.selArticles = s.filter(a => !a.bio); break }
        case 4 : { this.selArticles = s.filter(a => a.poidsPiece >= 0); break }
        case 5 : { this.selArticles = s.filter(a => a.poidsPiece > 0); break }
        case 6 : { this.selArticles = s.filter(a => a.poidsPiece === 0); break }
        case 7 : { this.selArticles = s.filter(a => a.poidsPiece === -1); break }
        case 8 : { this.selArticles = s.filter(a => !a.image); break }
        case 9 : { this.selArticles = s.filter(a => a.imagel > n); break }
        case 10 : { this.selArticles = s.filter(a => a.id.startsWith(p)); break }
        case 11 : { this.selArticles = s.filter(a => a['code-barre'].startsWith(p)); break }
        case 12 : { this.selArticles = s.filter(a => a.codeCourt.toUpperCase.startsWith(p.toUpperCase)); break }
        case 13 : { this.selArticles = s.filter(a => a.nomN.indexOf(P) !== -1); break }
        case 14 : { this.selArticles = s.filter(a => a.nomN.startsWith(P)); break }
        case 15 : { this.selArticles = s.filter(a => a.status === 1 || a.status === 4); break }
        case 16 : { this.selArticles = s.filter(a => a.status === 2); break }
        case 17 : { this.selArticles = s.filter(a => a.status >= 3); break }
        case 18 : { this.selArticles = s.filter(a => a.status === 0); break }
        case 19 : { this.selArticles = s.filter(a => this.fichier.mapId[a.id] > 1) }
      }
      this.trier()
    },

    clicArticle (a, pos) {
      global.ficheArticle.ouvrir(a.n - 1, pos)
    },

    ajouterArticle () {
      let data = {}
      for (let i = 0, c = null; (c = colonnes[i]); i++) { data[c] = defVal[i] }
      this.articles.push(data)
      this.selArticles.push(data)
      data.n = this.articles.length
      decore(data)
      this.fichier.stats()
      this.clicArticle(data, this.selArticles.length - 1)
    },

    dataChange () {
      this.fichier.stats()
      this.filtrer()
      this.trier()
    },

    erreur (msg, err) {
      this.texteAlerte = msg + (err ? '\n' + err : '')
      this.alerte = true
      this.panneauGauche = false
      this.panneauDroit = false
      this.modifie = false
    },

    information (msg) {
      this.texteAlerte = msg
      this.info = true
      this.panneauGauche = false
      this.panneauDroit = false
      this.modifie = false
    },

    panneauFichiers () {
      this.lstArch = listeArchMod(true)
      this.lstMod = listeArchMod()
      this.panneauDroit = true
    },

    verifOuverture () {
      if (!this.fichier || !this.modifie) { return true }
      this.perdreModif = true
      return new Promise(resolve => {
        this.resolveFichier = resolve
      })
    },

    async ouvrirFichier (f, arch) {
      this.chargement = true
      if (await this.verifOuverture()) {
        this.panneauDroit = false
        this.articles = []
        this.selArticles = []
        this.fichier = new Fichier(f, arch)
        try {
          this.articles = await this.fichier.lire()
          this.selArticles = this.articles
          this.chargement = false
        } catch (e) {
          this.fichier = null
          this.chargement = false
          this.erreur('Le fichier [' + f + '] est corrompu ou inaccessible.', e.message)
        }
      }
    },

    async nouveauFichier () {
      if (await this.verifOuverture()) {
        this.panneauDroit = false
        this.articles = []
        this.selArticles = []
        this.fichier = new Fichier('$N')
        try {
          this.articles = await this.fichier.lire()
          this.selArticles = this.articles
        } catch (e) {
          this.fichier = null
          this.erreur('Le nouveau fichier est corrompu ou inaccessible.', e.message)
        }
      }
    },

    async importFichier (name, path) {
      if (!name.endsWith('.csv')) {
        this.erreur('Le fichier sélectionné doit être un ".csv".')
        return
      }
      try {
        await copieFichier(name, path)
        await this.ouvrirFichier(name)
      } catch (err) {
        this.erreur('Le fichier sélectionné n\'a pas pu être importé comme modèle.\n', err.message)
      }
    },

    ouvrirODOO () {
      this.information('Cette fonctionnalité est en cours de développement')
    },

    async enregModele () {
      let m = this.nomModele
      this.enreg = false
      try {
        this.nomModele = ''
        await this.fichier.ecrire(m)
      } catch (e) {
        this.erreur('Impossible d\'enregistrer le fichier [' + m + ']', e.message)
      }
    },

    envoyer () {
      this.fichier.stats()
      if (this.fichier.nberreurs) {
        this.texteAlerte = 'Corriger les erreurs dans le fichier avant de l\'envoyer aux balances'
        this.alerte = true
      } else {
        this.envoyerfichier = true
      }
    },

    async envoyer2 () {
      this.dhArchivage = await this.fichier.ecrire(null, true)
      this.envoye = true
    },

    async detruire () {
      this.fichier.detruire()
      await this.ouvrirFichier()
    }
   }
}
</script>

<style lang="sass">
@import './css/app.sass'
.btnfermer
  position: absolute
  z-index: 10
  top: 0

.btnfermerg
  right: - (1.5 * $largeFontSize)

.btnfermerd
  left: - (1.5 * $largeFontSize)

.status
  font-size: $standardFontSize

.menuText
  font-size: $largeFontSize
  color: black

.modeleDialog
  width: 50%
  min-width: 400px

.menuButton
  font-size: $veryLargeFontSize !important
  color: $primary

.zoneErr
  height: 3rem
  color: black

.negative
  color: $negative !important

.pasArticles
  text-align: center
  font-style: italic
  font-size: $veryLargeFontSize

.titre1
  font-size: $largeFontSize
  font-weight: bold
  font-style: italic
  text-align: right
  margin: 0.5rem 0.5rem 0 0

.artErr
  background-color: white
  color: red
  font-weight: bold

.fichier
  font-size: $standardFontSize
  text-align: left
  margin: 0 0.5rem
  color: $blue-10
  text-decoration: underline
  cursor: pointer

.fichier:hover
  background-color: $blue-2

.nomModeleOK
  font-weight: normal
  font-size: $smallFontSize

.nomModeleKO
  font-weight: bold
  color: red
  font-size: $standardFontSize

.dialogText
  font-size: $largeFontSize

</style>
