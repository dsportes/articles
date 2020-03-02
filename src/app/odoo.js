// https://github.com/saidimu/odoo

import { remote } from 'electron'

const Odoo = remote.require('odoo')
import { config } from './config'

const minCB = config.minCB
const maxCB = config.maxCB
const map = config.map || { 'id': 'id', 'image': 'image', 'name_template': 'nom', 'barcode': 'code-barre', 'list_price': 'prix', 'rack_location': 'categorie', 'to_weight': 'unite' }

const fields = []
for (let f in map) { fields.push(f) }

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
                const params = {
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
                            for (let f in map) { a[map[f]] = '' + r[f] }
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
