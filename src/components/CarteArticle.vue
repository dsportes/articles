<template>
  <div class="carteArticle shadow-5 row no-wrap justify-start items-center" @click="$emit('clic-article')">
    <div class="col-auto"><img class="image" :src="'data:image/jpeg;base64,' + article.image"></div>
    <div class="col-auto column items-start droite">
      <div class="col-auto prix">{{ article.id }}</div>
      <div class="col-auto prix">{{ article['code-barre'].substring(1, 7) }}</div>
      <div class="col-auto prix">{{ article.categorie }}</div>
    </div>
    <div class="col nomproduit">[{{ article.codeCourt }}] {{ article.nom }}</div>
    <div class="col-auto column items-start droite">
      <div class="col-auto prix" v-if="article.poidsPiece === -1">{{ article.prix }}€ le Kg</div>
      <div class="col-auto prix" v-else>{{ article.prix }}€ piéce</div>
      <div class="col-auto prix" v-if="article.poidsPiece > 0">{{ article.poidsPiece }}g</div>
      <div v-if="article.bio" class="col self-end"><img class="iconeAB" src="../assets/logoAB.jpg"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CarteArticle',
  props: ['article'],
  data () {
    return {
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

