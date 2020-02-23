<template>
   <q-layout id="q-app" view="hHh lpR fFf" class="text-grey-3 bg-green-10">
    <q-header elevated>
      <q-toolbar class="row q-py-md bg-black text-white">
        <q-btn :size="standardBtnSize" flat round @click="panneauGauche = true" icon="menu" color="grey-2" aria-label="Menu"/>
        <q-toolbar-title>
          Mise à jour des balances
        </q-toolbar-title>
        <q-btn :size="standardBtnSize" flat @click="panneauFichiers()" icon="folder_open" label="Fichiers" color="grey-2" aria-label="Menu"/>
      </q-toolbar>
      <q-toolbar v-if="fichier" class="col row q-py-sm bg-blue-10 text-white">
        <q-toolbar-title>{{ fichier.label  }}</q-toolbar-title>
        <q-btn class="q-mx-xs" :size="standardBtnSize" color="white" text-color="blue-10" @click="enreg = true" icon="check_circle">Enregistrer<br>comme modèle</q-btn>
        <q-btn class="q-mx-xs" :size="standardBtnSize" color="white" text-color="blue-10" @click="envoyer()" icon="send">Envoyer<br>aux balances</q-btn>
        <q-btn v-if="fichier && fichier.nom && !fichier.arch" class="q-mx-xs" :size="standardBtnSize" color="negative" text-color="white" @click="detruiremodele = true" icon="delete">Supprimer<br>ce modèle</q-btn>
      </q-toolbar>
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
            <q-item-section class="menuText">Fichier importé de ODOO</q-item-section>
          </q-item>
         <q-item clickable class="bg-grey-1" v-ripple @click="ouvrirLocal()">
            <q-item-section avatar><q-icon class="menuButton" :name="'add_box'"/></q-item-section>
            <q-item-section class="menuText">Fichier local</q-item-section>
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
      <div v-if="selArticles.length === 0" class="pasArticles" style="height:100vh;margin-top:40vh">Pas d'articles</div>
      <div v-else style="width:100%">
        <carte-article v-for="a in selArticles" :key="a.id" :article="a" @clic-article="clicArticle(a)"></carte-article>
      </div>
    </q-page-container>

    <q-footer elevated class="q-py-md bg-black text-white status">
      <div v-if="!fichier || !articles.length">0 article</div>
      <div v-else class="row">
        <div class="q-px-xs">{{ articles.length }} article(s)</div>
        <div v-if="fichier.nbcrees !== 0" class="q-px-xs">{{ fichier.nbcrees }} créé(s)</div>
        <div v-if="fichier.nbmodifies !== 0" class="q-px-xs">{{ fichier.nbmodifies }} modifié(s)</div>
        <div v-if="fichier.nbsupprimes !== 0" class="q-px-xs">{{ fichier.nbsupprimes }} supprimé(s)</div>
        <div v-if="fichier.nberreurs !== 0" class="q-px-xs artErr">{{ fichier.nberreurs }} en erreur(s)</div>
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

    <q-dialog v-model="envoye">
      <q-card>
        <q-card-section>
          <div class="text-h6">Envoi du fichier</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div v-if="dhArchivage">Le fichier a été envoyé aux balances, sauvé et archivé sous le nom {{ dhArchivage }}</div>
          <div v-else>Le fichier est sauvé mais n'a pas été envoyé aux balances qui l'ont déjà avec le même contenu</div>
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

   </q-layout>
</template>

<script>
import { global, b64u } from './app/global'
import { config } from './app/config'
import { Fichier, listeArchMod } from './app/fichier'
import CarteArticle from './components/CarteArticle.vue'

export default {
  name: 'App',

  components: { CarteArticle },

  async mounted() {
    global.appVue = this
    this.fichier = new Fichier()
    try {
      this.articles = await this.fichier.lire()
      this.selArticles = this.articles
    } catch (e) {
      this.erreur(e.message)
    }
  },

  data () {
    return {
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
      envoye: false,
      exitApp: false,
      alerte: false,
      enreg: false,
      dhArchivage: '',
      texteAlerte: '',
      articles: [],
      selArticles: [],
      courant: null,
      nomModele: ''
    }
  },

  methods: {
    quit () { config.quit() },

    b64u (val) { return b64u(val, 4, 32) },

    clicArticle (article) { this.courant = article },

    erreur (err) {
      this.texteAlerte = 'Le fichier des articles est corrompu ou absent\n' + this.fichier.path + '\n' + err
      this.alerte = true
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
      if (await this.verifOuverture()) {
        this.panneauDroit = false
        this.articles = []
        this.selArticles = []
        this.fichier = new Fichier(f, arch)
        try {
          this.articles = await this.fichier.lire()
          this.selArticles = this.articles
        } catch (e) {
          this.fichier = null
          this.erreur(e.message)
        }
      }
    },

    ouvrirLocal () {

    },

    ouvrirODOO () {

    },

    async enregModele () {
      let m = this.nomModele
      this.enreg = false
      try {
        this.nomModele = ''
        await this.fichier.ecrire(m)
      } catch (e) {
        this.erreur(e.message)
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
  font-size: $smallFontSize

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

</style>
