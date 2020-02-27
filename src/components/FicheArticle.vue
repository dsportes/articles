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
        <div v-for="e in data.erreurs" :key="e" class="q-py-sm">{{ e }}</div>
      </q-scroll-area>
    </q-header>
    <q-page-container>
      <div class="column justify-start">
        <q-input class="shadow-5 input1" v-model="data.nom" clearable label="Nom" @input="verif('nom')" :rules="[ val => (val.length > 6 && val.length < 100) || 'nom absent ou de longueur < 4 ou > 100']">
          <template v-slot:append>
            <q-btn round size="xs" color="deep-orange" icon="undo" :disable="data.nom === dataAV.nom" @click="undo('nom')"/>
            <q-btn round size="xs" color="deep-orange" icon="replay" :disable="!dataI || data.nom === dataI.nom" @click="reinit('nom')"/>
          </template>
        </q-input>

        <q-input class="shadow-5 input1" v-model="data['code-barre']" clearable label="Code barre à 12 chiffres (le 0 en tête est omis)" @input="verif('code-barre')" :rules="[ val => val.length == 12 || '12 chiffres requis']">
          <template v-slot:append>
            <q-btn round size="xs" color="deep-orange" icon="undo" :disable="data['code-barre'] === dataAV['code-barre']" @click="undo('code-barre')"/>
            <q-btn round size="xs" color="deep-orange" icon="replay" :disable="!dataI || data['code-barre'] === dataI['code-barre']" @click="reinit('code-barre')"/>
          </template>
        </q-input>

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
import { clone, eq, colonnes, defVal, decore, maj } from '../app/fichier'
import { global } from '../app/global'

export default {
  name: 'FicheArticle',
  mounted() {
    global.ficheArticle = this
  },
  data () {
    return {
      labelStatus: ['inchangé', 'créé', 'modifié', 'supprimé', 'créé puis supprimé'],
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
    filtreErr (c) {
      let x = []
      let v = this.data.erreurs
      for (let i = 0, e = null; (e = v[i]); i++) { if (!e.startsWith(c)) { x.push(e) } }
      this.data.erreurs = x
    },

    undo (c) {
      this.data[c] = this.dataAV[c]
      this.verif(c)
    },

    reinit (c) {
      if (this.dataI) {
        this.data[c] = this.dataI[c]
        this.verif(c)
      }
    },

    verif (c) {
      this.filtreErr(c.substring(0, 2))
      if (!this.data[c]) { this.data[c] = '' }
      maj(this.data, c, this.data[c])
      this.setStatus()
    },

/*
    verifCB () {
      this.filtreErr('co')
      if (!this.data['code-barre']) { this.data['code-barre'] = '' }
      let c = this.data['code-barre']
      if (c.length === 12) {
        maj(this.data, 'code-barre', c)
      } else {
        this.data.erreurs.push('code barre de longueur différente de 12')
      }
      this.setStatus()
    },
*/
    ouvrir (idx, pos) {
      this.fichier = global.appVue.fichier
      this.max = global.appVue.selArticles.length
      this.idx = idx
      this.pos = pos
      this.data = this.fichier.articles[this.idx]
      this.dataAV = clone(this.data)
      this.dataI = this.idx < this.fichier.articlesI.length ? this.fichier.articlesI[this.idx] : null
      this.ficheArticle = true
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
      this.idx = global.appVue.selArticles[this.pos].n
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
      this.idx = global.appVue.selArticles[this.pos].n
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
      const src = !cr ? this.fichier.articlesI : defVal
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

</style>

