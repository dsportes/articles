<template>
   <q-layout id="q-app" view="hHh lpR fFf">
    <q-header elevated class="text-grey-9 bg-grey-3">
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


    <q-page-container class="bg-grey-1">
      <q-table title="Articles" class="my-sticky-header-column-table" :data="selArticles" :columns="colonnes" row-key="id" />
    </q-page-container>

    <!-- q-page-container class="bg-grey-1">
      <q-page v-if="this.selArticles.length == 0" class="flex flex-center">
        <div class="pasArticle">Pas d'article répondant à cette sélection</div>
      </q-page>
      <q-page v-else>
        <div class="column no-wrap">
          <carte-article v-for="article in selArticles" :key="article.id" :article="article" @clic-article="clicArticle(article)"></carte-article>
        </div>
      </q-page>
    </q-page-container -->

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

/* eslint-disable no-unused-vars */
import CarteArticle from './components/CarteArticle.vue'

export default {
  name: 'App',

  // components: { CarteArticle },

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
      // id nom code-barre prix unite image
      colonnes: [
        { name: 'id', align: 'left', label: 'Code', field: 'id', sortable: true },
        { name: 'nom', align: 'left', label: 'Nom', field: 'nom', sortable: true, style: 'width: 40%' },
        { name: 'ean', align: 'left', label: 'Code barre EAN13', field: 'code-barre', sortable: true },
        { name: 'prix', align: 'left', label: 'Prix', field: 'prixN', sortable: true },
        { name: 'bio', align: 'left', label: 'Bio', field: 'bio', sortable: true, format: (val, row) => val ? 'Bio' : '' },
        { name: 'poidsPiece',
          align: 'left',
          label: 'Poids U',
          field: 'poidsPiece',
          sortable: true,
          format: (val, row) => val === -1 ? 'Kg' : (!val ? 'unité' : val + 'g') }
      ]

    }
  },

  methods: {
    quit () {
      config.quit()
    },

    clicArticle (article) {
    },

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

// Copié collé
.my-sticky-header-column-table
  /* height or max-height is important */
  height: 50rem

  /* specifying max-width so the example can
    highlight the sticky column on any browser window */
  max-width: 100%

  td:first-child
    /* bg color is important for td; just specify one */
    background-color: #c1f4cd !important

  tr th
    position: sticky
    /* higher than z-index for td below */
    z-index: 2
    /* bg color is important; just specify one */
    background: #fff

  /* this will be the loading indicator */
  thead tr:last-child th
    /* height of all previous header rows */
    top: 48px
    /* highest z-index */
    z-index: 3
  thead tr:first-child th
    top: 0
    z-index: 1
  tr:first-child th:first-child
    /* highest z-index */
    z-index: 3

  td:first-child
    z-index: 1

  td:first-child, th:first-child
    position: sticky
    left: 0
</style>
