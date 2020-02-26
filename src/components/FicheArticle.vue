<template>
<div>
  <q-dialog v-model="ficheArticle" persistent>
  <q-layout view="Lhh lpR fff" container class="bg-white">
    <q-header class="bg-primary column">
      <q-toolbar class="col-auto">
        <q-btn round color="primary" icon="skip_previous" />
        <div>{{ (idx + 1) }} / {{ max }}</div>
        <q-btn round color="primary" icon="skip_next" />
        <q-toolbar-title>Article #{{n}} - [{{data.codeCourt}}] Code:{{data.id}}</q-toolbar-title>
          <q-btn v-if="estmodifie" flat v-close-popup dense icon="done" label="Valider" @click="validerEtFermer()"/>
          <q-btn v-else flat v-close-popup dense icon="close" label="Fermer" @click="fermer()"/>
      </q-toolbar>
      <div class="col-auto row justify-around">
        <q-btn :disable="!estmodifie" icon="done" color="deep-orange" @click="annuler()">Annuler tous<br>les changements</q-btn>
        <q-btn :disable="!pasinitial" icon="done" color="deep-orange" @click="retablir()">Rétablir<br>l'état initial</q-btn>
      </div>
      <q-scroll-area style="height: 50px;">
        <div v-for="e in data.erreurs" :key="e" class="q-py-xs">{{ e }}</div>
      </q-scroll-area>
    </q-header>
    <q-page-container>
      <div class="ficheArticle shadow-5 column q-pa-md q-ma-md justify-start">
        <div class="titre">Article : {{data.id}} - [{{data.codeCourt}}</div>
        <q-input v-model="data.nom" clearable label="Nom" @input="verif()" :rules="[ val => val.length > 6 || 'Un nom a au moins 6 cattactères']"/>
        <q-input v-model="data.ean6" clearable label="Code barre à 6 chiffres" @input="cb6(value)" :rules="[ val => val.length == 6 || '6 chiffres requis']"/>
      </div>
    </q-page-container>
  </q-layout>
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
</div>
</template>

<script>
import { clone, eq, colonnes, defVal, decore } from '../app/fichier'
import { global } from '../app/global'

export default {
  name: 'FicheArticle',
  mounted() {
    global.ficheArticle = this
  },
  props: ['fichier', 'max'],
  data () {
    return {
      ficheArticle: false,
      idx: 0,
      pos: 0,
      data: {},
      dataAV: {},
      dataI: {},
      perdreModif: false,
      n: 0
    }
  },

  computed: {
    estmodifie () {
      return this.data.nom !== this.dataAV.nom ||
        this.data.id !== this.dataAV.id ||
        this.data['code-barre'] !== this.dataAV['code-barre'] ||
        this.data.prix !== this.dataAV.prix ||
        this.data.categorie !== this.dataAV.categorie ||
        this.data.unite !== this.dataAV.unite ||
        this.data.image !== this.dataAV.image
    },

    pasinitial () {
      return this.dataI && (
        this.data.nom !== this.dataI.nom ||
        this.data.id !== this.dataI.id ||
        this.data['code-barre'] !== this.dataI['code-barre'] ||
        this.data.prix !== this.dataI.prix ||
        this.data.categorie !== this.dataI.categorie ||
        this.data.unite !== this.dataI.unite ||
        this.data.image !== this.dataI.image
      )
    }
  },

  methods: {
    ouvrir (idx, pos) {
      this.idx = idx
      this.pos = pos
      this.data = this.fichier.articles[this.idx]
      this.dataAv = clone(this.data)
      this.dataI = this.idx < this.fichier.articlesI.length ? this.fichier.articlesI[this.idx] : null
      this.ficheArticle = true
    },

    perdreValidation () {
      if (!this.estmodifie()) { return true }
      this.perdreModif = true
      return new Promise(resolve => {
        this.resolve = resolve
      })
    },

    async precedent () {
      if (this.pos === 0) { return }
      this.pos--
      if (this.estmodifie()) {
        if (await this.perdreValidation()) {
          this.annuler()
        } else {
          this.valider()
        }
      }
      this.ouvrir(this.idx, this.pos)
    },

    async suivant () {
      if (this.idx === this.fichier.articles.length - 1) { return }
      this.pos++
      if (this.estmodifie()) {
        if (await this.perdreValidation()) {
          this.annuler()
        } else {
          this.valider()
        }
      }
      this.ouvrir(this.idx, this.pos)
    },

    setStatus () {
      const cr = this.idx >= this.fichier.articlesI.length
      if (cr) {
        this.data.status = eq(this.data, defVal) ? 4 : 1
      } else {
        this.data.status = eq(this.data, this.dataI) ? 0 : 2
      }
    },

    valider () {
      this.setStatus()
      decore(this.data)
      this.fichier.stats()
    },

    annuler () {
      for (let i = 0, f = null; (f = colonnes[i]); i++) { this.data[f] = this.dataAV[f] }
      this.valider()
    },

    retablir () {
      const cr = this.idx >= this.fichier.articlesI.length
      const src = !cr ? this.fichier.articleI : defVal
      for (let i = 0, f = null; (f = colonnes[i]); i++) { this.data[f] = src[f] }
      this.valider()
    },

    validerEtFermer() {
      this.valider()
      this.ficheArticle = false
    },

    fermer () {
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

.dialogText
  font-size: $largeFontSize

</style>

