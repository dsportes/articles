import { remote } from 'electron'

const Odoo = remote.require('odoo-xmlrpc')
import { config } from './config'

const minCB = config.minCB
const maxCB = config.maxCB
const map = config.map || { 'id': 'id', 'name_template': 'nom', 'barcode': 'code-barre', 'list_price': 'prix', 'rack_location': 'categorie', 'to_weight': 'unite', 'other_information': 'image' }

const fields = []
for (let f in map) { fields.push(f) }

const odoo = new Odoo({
    url: config.url,
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
                const filtre = [['barcode', '>=', minCB], ['barcode', '<=', maxCB]]
                const inParams = []
                inParams.push(filtre)
                // inParams.push(0); // offset
                // inParams.push(5); // limit
                const params = []
                params.push(inParams)
                odoo.execute_kw('product.product', 'search', params, (err, value) => {
                    if (err) {
                        reject(err)
                    } else {
                        const inParams = []
                        inParams.push(value) // ids
                        inParams.push(fields) // fields
                        const params = []
                        params.push(inParams)
                        odoo.execute_kw('product.product', 'read', params, (err2, value2) => {
                            if (err2) {
                                reject(err2)
                            } else {
                                const res = []
                                for (let i = 0, r = null; (r = value2[i]); i++) {
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
            }
        })
    })
}
