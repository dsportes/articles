<template>
   <q-layout id="q-app" view="hHh lpR fFf">
    <q-header ref="hdr" elevated class="text-grey-9 bg-grey-3">
      <q-toolbar class="col row q-py-md">
        <q-btn :size="standardBtnSize" flat round @click="panneauGauche = true" icon="menu" aria-label="Menu"/>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="panneauGauche" overlay :width="500" bordered content-class="bg-grey-7">
      <div class="absolute" style="top:0;right:0">
        <q-btn :size="standardBtnSize" dense round unelevated color="accent" icon="chevron_left"/>
      </div>
      <q-list>
        <q-item clickable v-ripple class="column zoneErr" @click="panneauGauche = false">
          <div v-if="this.articles.length == 0" class="col">Pas d'article</div>
          <div v-else class="col">{{this.articles.length}} articles</div>
        </q-item>
        <q-separator />
        <q-item clickable v-ripple @click="chargementArticles();panneauGauche = false">
          <q-item-section avatar><q-icon class="menuButton" :name="'autorenew'"/></q-item-section>
          <q-item-section class="menuText">Recharger les articles</q-item-section>
        </q-item>
        <q-separator />
        <q-item clickable class="bg-grey-1" v-ripple @click="exitApp = true">
          <q-item-section avatar><q-icon class="menuButton negative" :name="'exit_to_app'"/></q-item-section>
          <q-item-section class="menuText negative">Quitter l'application</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container class="bg-grey-1 row">
      <q-scroll-area class="col column" :style="sty1()">
        <carte-article v-for="a in selArticles" :key="a.id" :article="a" @clic-article="clicArticle(a)"></carte-article>
      </q-scroll-area>
      <div class="col-5 bg-grey-3 detail">
        <div  v-if="courant ? true : false">
          <fiche-article :article="courant" @clic-enreg="enregArticle()"/>
        </div>
        <div v-else class="text-h4 text-grey-6 text-center pasArticle">Pas d'article sélectionné</div>
      </div>
    </q-page-container>

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

   </q-layout>
</template>

<script>
import { global } from './app/global'
import { config, lectureArticles } from './app/config'
import CarteArticle from './components/CarteArticle'
import FicheArticle from './components/FicheArticle'

export default {
  name: 'App',

  components: { CarteArticle, FicheArticle },

  mounted() {
    global.appVue = this
    this.chargementArticles(articles => {
      this.articles = articles
      this.selArticles = this.articles
    })
  },

  data () {
    return {
      largeBtnSize: '1.5rem',
      standardBtnSize: '1rem',
      panneauGauche: false,
      exitApp: false,
      alerte: false,
      texteAlerte: '',
      articles: [],
      selArticles: [],
      courant: null
    }
  },

  methods: {
    quit () { config.quit() },

    sty1 () { return 'height:' + (window.innerHeight - 80) + 'px' },

    clicArticle (article) { this.courant = article },

    chargementArticles () {
      lectureArticles((err, articles) => {
        if (!err) {
          this.articles = articles
          this.selArticles = this.articles
        } else {
          this.texteAlerte = 'Le fichier des articles est corrompu ou absent\n' + config.articlesPath + '\n' + err
          this.alerte = true
        }
        this.panneauGauche = false
      })
    }

  }
}
</script>

<style lang="sass">
@import './css/app.sass'

.menuText
  font-size: $largeFontSize
  color: white

.menuButton
  font-size: $veryLargeFontSize !important
  color: white

.zoneErr
  height: 3rem
  color: white

.negative
  color: $negative !important

.detail
  overflow:hidden

.pasArticle
  margin: 2rem

</style>
