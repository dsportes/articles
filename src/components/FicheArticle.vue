<template>
<div>
  <q-dialog v-model="ficheArticle" full-width persistent>
  <q-layout view="Lhh lpR fff" container class="bg-white">
    <q-header class="bg-grey-9 column">
      <q-toolbar class="col-auto q-py-md">
        <q-btn :disable="pos === 0" round color="primary" icon="skip_previous" @click="precedent()"/>
        <div class="q-px-md">{{ (pos + 1) }} / {{ max }}</div>
        <q-btn :disable="pos === max - 1" round color="primary" icon="skip_next" @click="suivant()"/>
        <q-toolbar-title>Article #{{data.n}} - [{{data.codeCourt}}] Code:{{data.id}}</q-toolbar-title>
          <q-btn v-if="estmodifie" dense icon-right="done" color="primary" @click="validerEtFermer()">Valider et fermer</q-btn>
          <q-btn v-else dense icon-right="close" color="primary" label="Fermer" @click="fermer()"/>
      </q-toolbar>
      <div style="margin: 0 0.5rem">
      <div class="col-auto row justify-between items-center">
        <div :class="(this.data.status ? 'text-deep-orange text-h4' : 'text-h5')">{{labelStatus[this.data.status]}}</div>
        <div class="col-auto row q-gutter-sm">
          <q-btn class="col-auto" :disable="!estmodifie" icon="undo" color="deep-orange" @click="annuler()">Annuler tous<br>les changements</q-btn>
          <q-btn class="col-auto" :disable="!pasinitial" icon="replay" color="deep-orange" @click="retablir()">Rétablir<br>l'état initial</q-btn>
          <q-btn v-if="this.data.status < 4" class="col-auto" icon="undo" color="deep-orange" @click="supprimer()">Supprimer<br>l'article</q-btn>
          <q-btn v-else icon="redo" class="col-auto" color="deep-orange" @click="reactiver()">Ré-activer<br>l'article</q-btn>
        </div>
      </div>
      </div>
      <q-scroll-area class="erreurs">
        <div v-for="e in erreurs" :key="e" class="q-py-sm">{{ e }}</div>
      </q-scroll-area>
    </q-header>
    <q-page-container>
      <div class="column justify-start">
        <q-input class="shadow-5 input1" color="black" bottom-slots :error="erMap.id ? true : false" :error-message="erMap.id" v-model="data.id" clearable label="Code article de 1 à 6 chiffres" @input="verif('id')">
          <template v-slot:append>
            <q-btn round size="xs" color="deep-orange" icon="undo" :disable="data.id === dataAV.id" @click="undo('id')"/>
            <q-btn round size="xs" color="deep-orange" icon="replay" :disable="!dataI || data.id === dataI.id" @click="reinit('id')"/>
          </template>
        </q-input>

        <q-input class="shadow-5 input1" color="black" bottom-slots :error="erMap.no ? true : false" :error-message="erMap.no" v-model="data.nom" clearable label="Nom" @input="verif('nom')">
          <template v-slot:append>
            <q-btn round size="xs" color="deep-orange" icon="undo" :disable="data.nom === dataAV.nom" @click="undo('nom')"/>
            <q-btn round size="xs" color="deep-orange" icon="replay" :disable="!dataI || data.nom === dataI.nom" @click="reinit('nom')"/>
          </template>
        </q-input>

        <q-input class="shadow-5 input1" color="black" bottom-slots :error="erMap.co ? true : false" :error-message="erMap.co" v-model="data['code-barre']" clearable label="Code barre à 13 chiffres)" @input="verif('code-barre')">
          <template v-slot:append>
            <q-btn round size="xs" color="deep-orange" icon="undo" :disable="data['code-barre'] === dataAV['code-barre']" @click="undo('code-barre')"/>
            <q-btn round size="xs" color="deep-orange" icon="replay" :disable="!dataI || data['code-barre'] === dataI['code-barre']" @click="reinit('code-barre')"/>
          </template>
        </q-input>

        <q-input class="shadow-5 input1" color="black" bottom-slots :error="erMap.pr ? true : false" :error-message="erMap.pr" v-model="data.prixS" clearable @input="verif('prixS')"
          :label="'Saisir le prix en centimes ==> ' + (data.prixS !== '0' ? data.prix : '0') + '€'">
          <template v-slot:append>
            <q-btn round size="xs" color="deep-orange" icon="undo" :disable="data.prix === dataAV.prix" @click="undo('prix')"/>
            <q-btn round size="xs" color="deep-orange" icon="replay" :disable="!dataI || data.prix === dataI.prix" @click="reinit('prix')"/>
          </template>
        </q-input>

        <div class="q-gutter-sm shadow-5 input1">
          <div>Catégorie</div>
          <q-radio v-for="c in categories" :key="c" :val="c" :label="c" v-model="data.categorie"/>
        </div>

        <div class="q-gutter-sm shadow-5 input1">
          <q-radio v-model="data.unite" val="kg" label="au Kg" />
          <q-radio v-model="data.unite" val="Unité(s)" label="à l'unité" />
        </div>

        <div class="q-gutter-sm shadow-5 input1 column q-gutter-sm items-center">
          <div v-if="data.image ? true : false">
            <img class="col-auto image2" :src="'data:image/jpeg;base64,' + data.image"/>
            <div class="col-auto">{{ data.imagel + 'x' + data.imageh }}</div>
          </div>
          <div v-else>Pas d'image</div>
          <q-btn class="col-auto" size="md" color="deep-orange" label="Autre image depuis un fichier"
            @click="nouvelleImage = true"/>
        </div>
      </div>
    </q-page-container>
  </q-layout>
  </q-dialog>

  <q-dialog v-model="nouvelleImage" class="bg-white" persistent>
    <q-card>
      <q-card-section class="row items-center">
          <q-file class="col-auto" v-model="imageLocale" label="Choisir un fichier jpeg" style="width:20rem;"/>
      </q-card-section>
      <q-card-actions class="column items-end no-wrap">
          <q-btn class="col-auto" v-close-popup flat size="md" color="primary" label="Couvrante : coupée en haut/bas ou à gauche/droite"
            :disable="img == null" @click="resize('cover')"/>
          <q-btn class="col-auto" v-close-popup flat size="md" color="primary" label="Centrée : marge noire en haut/bas ou à gauche/droite"
            :disable="img == null" @click="resize('content')"/>
          <q-btn class="col-auto" flat label="Je renonce" color="negative" v-close-popup
            @click="nouvelleImage = false"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="perdreModif" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <q-avatar icon="block" color="negative" text-color="white"/>
        <span class="q-ml-sm dialogText">Cet article a été modifié. Voulez-vous vraiment perdre les changements ?</span>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Non, je les valide" color="primary" v-close-popup
          @click="perdreModif = false;resolve(false)"/>
        <q-btn flat label="Oui, je les perd" color="negative" v-close-popup
          @click="perdreModif = false;resolve(true)"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="fermerqm" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <q-avatar icon="block" color="negative" text-color="white"/>
        <span class="q-ml-sm dialogText">Cet article comporte au moins une erreur. Voulez-vous vraiment le valider et fermer ?</span>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat size="md" label="Non, je le laisse ouvert pour corriger" color="primary" v-close-popup
          @click="fermerqm = false;resolve(false)"/>
        <q-btn flat size="md" label="Oui, je ferme quand-même" color="negative" v-close-popup
          @click="fermerqm = false;resolve(true)"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

</div>
</template>

<script>
/*
data.img.getBase64Async(mime); // Returns Promise
Jimp.MIME_JPEG; // "image/jpeg"
image.contain( w, h[, alignBits || mode, mode] );    // scale the image to the given width and height, some parts of the image may be letter boxed
image.cover( w, h[, alignBits || mode, mode] );      // scale the image to the given width and height, some parts of the image may be clipped
fs.readSyncFile('/etc/passwd', { encoding: 'base64' })
*/

import { clone, eq, colonnes, defVal, decore, maj } from '../app/fichier'
import { global } from '../app/global'
import { config } from '../app/config'
const fs = require('fs')
const Jimp = require('jimp')

const defValObj = {}
for (let i = 0, c = null; (c = colonnes[i]); i++) { defValObj[c] = defVal[i] }

export default {
  name: 'FicheArticle',
  mounted() {
    global.ficheArticle = this
  },
  data () {
    return {
      labelStatus: ['inchangé', 'créé', 'modifié', 'supprimé', 'créé puis supprimé'],
      categories: config.categories || ['F', 'L', 'V', 'A'],
      fichier: null,
      max: 0,
      ficheArticle: false,
      fermerqm: false,
      idx: 0,
      pos: 0,
      data: {},
      dataAV: {},
      dataI: {},
      perdreModif: false,
      n: 0,
      imageLocale: null,
      nouvelleImage: false,
      img: null,
      erreurs: [],
      erMap: {}
    }
  },

  computed: {
    estmodifie () {
      let b = this.data.nom !== this.dataAV.nom ||
        this.data.id !== this.dataAV.id ||
        this.data['code-barre'] !== this.dataAV['code-barre'] ||
        this.data.prix !== this.dataAV.prix ||
        this.data.categorie !== this.dataAV.categorie ||
        this.data.unite !== this.dataAV.unite ||
        this.data.image !== this.dataAV.image
      return b
    },

    pasinitial () {
      let b = this.dataI && (
        this.data.nom !== this.dataI.nom ||
        this.data.id !== this.dataI.id ||
        this.data['code-barre'] !== this.dataI['code-barre'] ||
        this.data.prix !== this.dataI.prix ||
        this.data.categorie !== this.dataI.categorie ||
        this.data.unite !== this.dataI.unite ||
        this.data.image !== this.dataI.image
      )
      return b
    }
  },

  watch: {
    imageLocale(file) {
      if (file) {
        this.imageLocale = null
        this.chargeImage(file.path)
      }
    }
  },

  methods: {
    filtreErr (c, err) {
      this.erMap = {}
      this.erreurs = []
      let v = this.data.erreurs
      for (let i = 0, e = null; (e = v[i]); i++) {
        if (!e.startsWith(c)) {
          this.erreurs.push(e)
          this.erMap[c] = e
        }
      }
      if (err) {
        this.erreurs.push(err)
        this.erMap[c] = err
      }
      this.data.erreurs = this.erreurs
    },

    async undo (c) {
      this.data[c] = this.dataAV[c]
      await this.verif(c)
    },

    async reinit (c) {
      if (this.dataI) {
        this.data[c] = this.dataI[c]
        await this.verif(c)
      }
    },

    async verif (c) {
      let err
      if (!this.data[c]) this.data[c] = ''
      if (c === 'prixS') {
        if (!this.data.prixS) this.data.prixS = '0'
        err = await maj(this.data, 'prix', this.data.prixS, true)
      } else {
        err = await maj(this.data, c, this.data[c], true)
      }
      this.filtreErr(c.substring(0, 2), err)
      this.setStatus()
      return err || ''
    },

    async ouvrir (idx, pos) {
      this.fichier = global.appVue.fichier
      this.max = global.appVue.selArticles.length
      this.idx = idx
      this.pos = pos
      this.data = this.fichier.articles[this.idx]
      this.dataAV = clone(this.data)
      this.dataI = this.idx < this.fichier.articlesI.length ? this.fichier.articlesI[this.idx] : null
      this.ficheArticle = true
    },

    fermer () {
      this.idx = 0
      this.pos = 0
      this.data = {}
      this.dataAV = {}
      this.dataI = {}
      this.ficheArticle = false
    },

    resize(option) {
      if (!this.img) { return }
      let x = 'data:image/jpeg;base64,'
      try {
        this.img = option === 'cover' ? this.img.cover(128, 128) : this.img.contain(128, 128)
        this.img.getBase64Async('image/jpeg')
        .then(b64 => {
          this.data.image = b64.substring(x.length)
          this.data.imagel = this.img.bitmap.width
          this.data.imageh = this.img.bitmap.height
          this.img = null
          this.filtreErr('im')
        }).catch(err => {
          this.img = null
          this.filtreErr('im', 'image non affichable (1) : ' + err.message)
        })
      } catch (err) {
        this.img = null
        this.filtreErr('im', 'image non affichable (2) : ' + err.message)
      }
    },

    async chargeImage(path) {
      this.img = null
      try {
        let b64 = fs.readFileSync(path, { encoding: 'base64' })
        let buffer = Buffer.from(b64, 'base64')
        this.img = await Jimp.read(buffer)
        this.filtreErr('im')
      } catch (err) {
        this.filtreErr('im', 'image non affichable : ' + err.message)
      }
    },

    perdreValidation () {
      if (!this.estmodifie) { return true }
      this.perdreModif = true
      return new Promise(resolve => {
        this.resolve = resolve
      })
    },

    async precedent () {
      if (this.pos === 0) { return }
      this.pos--
      if (this.estmodifie) {
        if (await this.perdreValidation()) {
          this.annuler()
        } else {
          this.valider()
        }
      }
      this.idx = global.appVue.selArticles[this.pos].n - 1
      this.ouvrir(this.idx, this.pos)
    },

    async suivant () {
      if (this.pos === this.max - 1) { return }
      this.pos++
      if (this.estmodifie) {
        if (await this.perdreValidation()) {
          this.annuler()
        } else {
          this.valider()
        }
      }
      this.idx = global.appVue.selArticles[this.pos].n - 1
      this.ouvrir(this.idx, this.pos)
    },

    supprimer () {
         this.data.status = this.data.status === 1 ? 4 : 3
    },

    reactiver () {
      this.data.status = this.idx >= this.fichier.articlesI.length ? 1 : (eq(this.data, this.dataI) ? 0 : 2)
    },

    setStatus () {
      const cr = this.idx >= this.fichier.articlesI.length
      if (cr) {
        this.data.status = eq(this.data, defValObj) ? 4 : 1
      } else {
        this.data.status = eq(this.data, this.dataI) ? 0 : 2
      }
    },

    async valider () {
      this.setStatus()
      await decore(this.data)
      global.appVue.dataChange()
    },

    annuler () {
      for (let i = 0, f = null; (f = colonnes[i]); i++) { this.data[f] = this.dataAV[f] }
      this.valider()
    },

    retablir () {
      const cr = this.idx >= this.fichier.articlesI.length
      const src = !cr ? this.fichier.articlesI[this.idx] : defValObj
      for (let i = 0, f = null; (f = colonnes[i]); i++) { this.data[f] = src[f] }
      this.valider()
    },

    fermerQuandMeme () {
      this.fermerqm = true
      return new Promise(resolve => {
        this.resolve = resolve
      })
    },

    async validerEtFermer() {
      if (this.data.erreurs.length !== 0 && !(await this.fermerQuandMeme())) { return }
      this.valider()
      this.ficheArticle = false
    }

  }
}
</script>

<style lang="sass">
@import '../css/app.sass'

.titre
  font-size: $largeFontSize
  text-align: left
  padding: 1rem 0
  font-weight: bold

.erreurs
  height: 5rem
  background-color: $grey-3
  color: $deep-orange
  margin: 0.5rem
  padding: 0.5rem

.dialogText
  font-size: $largeFontSize

.input1
  margin: 0.5rem
  padding: 0rem 0.5rem 2rem 0.5rem
  color: black
  font-size: $largeFontSize

.btnimg
  max-width: 8rem !important

.image2
  border: 2px solid black
  background: repeating-linear-gradient(to right, #f6ba52, #f6ba52 10px, #ffd180 10px, #ffd180 20px)
  width: 128px

</style>

