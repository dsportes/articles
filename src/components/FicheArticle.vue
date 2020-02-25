<template>
  <div class="ficheArticle shadow-5 column q-pa-md q-ma-md justify-start">
    <div class="titre">Article : {{data.id}} - [{{data.codeCourt}}</div>
    <q-btn class="self-center" size="md" color="primary" icon="undo" label="Restaurer l'état initial" @click="restaurer()"/>
    <q-input v-model="article.nom" clearable label="Nom" @input="verif()" :rules="[ val => val.length > 6 || 'Un nom a au moins 6 cattactères']"/>
    <q-input v-model="article.codebarre6" clearable label="Code barre à 6 chiffres" @input="cb6(value)" :rules="[ val => val.length == 6 || '6 chiffres requis']"/>
  </div>
</template>

<script>

export default {
  name: 'FicheArticle',
  props: ['article'],
  data () {
    return {
      erreur: ''
    }
  },
  methods: {
    restaurer () {
      let orig = []
      if (orig) {
        for (let f in orig) { this.article[f] = orig[f] }
      }
    },

    cb6 (v) {
      if (v.length !== 6) {
        this.erreur = 'Le code barre doit avoir 6 chiffres'
        return
      }
      for (let i = 0; i < 6; i++) {
        let c = v.charAt(i)
        if (c < '0' || c > '9') {
          this.erreur = 'Le code barre doit avoir 6 chiffres'
          return
        }
      }
      this.codebarre6 = v
    }
  }
}
</script>

<style lang="sass">
@import '../css/app.sass'
$hauteur: 5rem

.carteArticle
  height: $hauteur
  margin: 0.5rem 1rem 0 0.5rem
  padding: 0
  background-color: white
  cursor: pointer
  overflow: hidden

.titre
  font-size: $veryLargeFontSize
  text-align: left
  padding: 1rem 0
  font-weight: bold

.erreur
  font-size: $standardFontSize
  text-align: left
  padding: 0.5rem 0
  color: $negative

.image
  width: $hauteur
  height: $hauteur
  margin: 0.1rem

.nomproduit
  padding: 0.5rem
  text-align: left
  font-size: $standardFontSize
  font-weight: bold

.droite
  margin-right: 0.5rem

.prix
  font-size: $standardFontSize

.iconeAB
  width: $veryLargeFontSize
  height: $veryLargeFontSize

</style>

