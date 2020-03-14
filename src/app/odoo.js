/*
Module d'interrogation de Odoo pour récupérer les produits selon les valeurs min et max des code-barres
Typiquement ceux commençant par 2.
L'API employé est JSON et le module trouvé est saidimi/odoo : il a l'air de marcher !
En configuration :
    "host": "vps765607.ovh.net", // host hébergeant le serveur
    "port": 8069, // port du serveur recevant les requêtes d'API
    "database": "odoo9", // nom de la base
    "username": "daniel@sportes.fr",
    "password": "xxxxx",
    "minCB": "2000000000000", // code barre le plus bas de la sélection
    "maxCB": "29999999999999", / code barre le plus haut de la sélection
    "map": {"id":"id", "name_template":"nom", "barcode":"code-barre", ... } // Pour chaque propriétés de product.product, nom de colonne dans le fichier CSV d'échange

    Une recherche = une connexion (pas de réutilisation de la connexion
*/
// https://github.com/saidimu/odoo

import { remote } from 'electron'

const Odoo = remote.require('odoo')
import { config } from './config'

const minCB = config.minCB
const maxCB = config.maxCB
const map = config.map || { 'id': 'id', 'image': 'image', 'name_template': 'nom', 'barcode': 'code-barre', 'list_price': 'prix', 'categ_id': 'categorie', 'unit': 'unite' }

/* Liste des propriétés de product.product à récupérer */
const fields = []
for (let f in map) { fields.push(f) }

/* Curieux nom : c'est la condition de filtre des produits pour l'API */
const domain = [['barcode', '>=', minCB], ['barcode', '<=', maxCB]]

const odoo = new Odoo({
    host: config.host,
    port: config.port,
    database: config.database,
    username: config.username,
    password: config.password
})

export function getArticles () {
    return new Promise((resolve, reject) => {
        odoo.connect(err => {
            if (err) {
                reject(err)
            } else {
                const params = { // paramètres requis pour le search_read
                    ids: [],
                    domain: domain,
                    fields: fields,
                    order: '',
                    limit: 9999,
                    offset: 0
                }
                odoo.search_read('product.product', params, (err, products) => {
                    if (err) {
                        reject(err)
                    } else {
                        const res = []
                        for (let i = 0, r = null; (r = products[i]); i++) {
                            const a = {}
                            // mapping entre les champs reçus et les noms des colonnes (propriété de l'article)
                            for (let f in map) { a[map[f]] = '' + r[f] }
                            /*
                            Les champs unite et categ_id sont à traiter selon la codification prévue
                            */
                            a.unite = a.unite === 'true' ? 'kg' : 'Unité(s)'
                            res.push(a)
                        }
                        resolve(res)
                    }
                })
            }
        })
    })
}
