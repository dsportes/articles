<template>
  <div class="ficheArticle shadow-5 column q-pa-md q-ma-md justify-start" @click="$emit('clic-article')">
    <q-btn class="self-center" size="md" color="primary" icon="undo" label="Restaurer l'état initial" @click="restaurer()"/>
    <q-input v-model="article.nom" label="Nom" />
  </div>
</template>

<script>
import { restaurer } from '../app/config'

export default {
  name: 'FicheArticle',
  props: ['article'],
  data () {
    return {
    }
  },
  methods: {
    restaurer () {
      let orig = restaurer(this.article.id)
      if (orig) {
        for (let f in orig) { this.article[f] = orig[f] }
      }
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

