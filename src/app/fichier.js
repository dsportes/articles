// CSV : id nom code-barre prix unite image
/* Décor :
n : numéro de ligne dans le fichier (identifiant)
nomN : nom normalisé, en majuscule et sans accent
ean6 : six caractètres de tête de l'ean (sans le 0)
ean13 : les 13 caractères incluant 0 en tête et la clé en queue
err[] : liste des erreurs détectées
codeCourt : deux lettres en majuscules calculées depuis l'id
poidsPiece : pods donné en fin du nom après // représentant le poids unitaire moyen d'une pièce
bio : true si le mot BIO figure dans le nom
prixN : prix sous forme numérique
*/

import { config } from './config'
import { removeDiacritics, editEAN, formatPrix } from './global'

const csv = require('csv-parser')
const fs = require('fs')
const path = require('path')

let dir
let archives

export function eq(a1, a2) {
 return a1.n === a2.n
    && a1.id === a2.id
    && a1['code-barre'] === ['code-barre']
    && a1.prix === a2.prix
    && a1.unite === a2.unite
    && a1.image === a2.image
}

export function listeArchives() {
    if (!dir) { 
        dir = config.dir
        archives = path.join(dir, 'archives')
    }
    let lst = []
    fs.readdirSync(archives).forEach(file => {
        if (file.endsWith('.csv')) { lst.push(file) }
    })
    return lst.sort()
}

export function clone(data) {
    return JSON.parse(JSON.stringify(data))
}

export class Fichier {
    constructor (nom) {
        if (!dir) { 
            dir = config.dir
            archives = path.join(dir, 'archives')
        }
        this.nom = nom
        this.path = nom ? path.join(archives, nom) : path.join(dir, 'articles.csv')
        this.articles = []
        this.articlesI = []
    }

    aChange () {
        if (this.articles.length !== this.articlesI.length) { return true }
        for (let i = 0; this.articles.length; i++) {
            if (!eq(this.articlesI[i], this.articles[i])) { return true }
        }
        return fakse
    }

    async lire () {
        return new Promise((resolve, reject) => {
            let n = 0
            this.erreur = false
            const rs = fs.createReadStream(this.path)
            rs.on('error', (e) => {
                reject(e)
            })
            try {
                rs.pipe(csv({ separator: ';' }))
                .on('data', (data) => {
                    n++
                    data.n = n
                    this.articlesI.push(data)
                    this.decore(data)
                    this.articles.push(data)
                })
                .on('end', () => {
                    resolve(this.articles)
                })
                rs.on('error', (e) => {
                    reject(e)
                })
            } catch (e) {
                reject(e)
            }
        })
    }

    nbErreurs () {
        let nb = 0
        for (let i = 0; i < this.articles.length; i++) {
            if (this.articles[i].erreurs.length) { nb++ }
        }
        return nb
    }

    majEAN (data, ean) {
        let x = editEAN(ean, 0)
        if (!x) {
            return 'code barre non numérique ou pas de longueur 6, 12 ou 13 (avec 0 devant)'
        }
        data.ean13 = editEAN(ean, 0)
        data.ean6 = data.ean13.substring(1, 7)
        data['code-barre'] = data.ean13.substring(1)
        return ''
    }

    majNom (data, nom) {
        if (!nom || nom.length < 4 || nom.length > 100) {
            return 'nom absent ou de longueur < 4 ou > 100'
        }
        data.nom = nom
        data.nomN = removeDiacritics(data.nom.toUpperCase())
        data.bio = data.nomN.indexOf('BIO') !== -1
        return ''
    }

    majPrix (data, prix) {
        if (!prix || typeof prix !== 'number' || prix < 0 || prix > 999999 ) {
            return 'prix absent ou < 0 ou > 999999'
        }
        data.prixN = prix
        data.prix = formatPrix(prix)
        return ''
    }

    majId (data, id) {
        try {
            const n = parseInt(id, 10)
            if (n < 1 || n > 999999) { return 'id non numérique compris entre 1 et 999999' }
            data.id = id
            // 'A' = 65
            const l1 = String.fromCharCode((n % 26) + 65)
            const l2 = String.fromCharCode((Math.floor(n / 26) % 26) + 65)
            data.codeCourt = l2 + l1
            return ''
        } catch (e) {
            return 'id non numérique compris entre 1 et 999999'
        }
    }

    majUKg (data, val) {
        if (val !== 'Unite(s)' && val !== 'kg') {
            return 'unite doit valoir "Unite(s)" ou "kg"'
        }
        data.unite = val
        if (val === 'Unite(s)') {
            let i = data.nom.lastIndexOf('//')
            if (i === -1) {
                data.poidsPiece = 0
            } else {
                const x = data.nom.substring(i + 2)
                const p = parseInt(x, 10)
                data.poidsPiece = isNaN(p) ? 0 : p
            }
        } else {
            data.poidsPiece = -1
        }
        return ''
    }

    decore (data) {
        data.erreurs = []
        let e
        e = this.majNom(data, data.nom)
        if (e) { data.erreurs.push(e) }

        e = editEAN(data['code-barre'], 0)
        if (e) {
            data.ean13 = e
            data.ean6 = data.ean13.substring(1, 7)
        } else {
            data.erreurs.push('code barre non numérique ou pas de longueur 6, 12 ou 13 (avec 0 devant)')
        }

        e = majId (data, data.id)
        if (e) { data.erreurs.push(e) }

        e = this.majUKg (data, data.unite)
        if (e) { data.erreurs.push(e) }

        try {
            e = parseFloat(data.prix)
            if (e < 0 || e > 999999 ) {
                data.erreurs.push('prix absent ou < 0 ou > 999999')
            } else {
                data.prixN = e
            }
        } catch (err) {
            data.erreurs.push('prix absent ou < 0 ou > 999999')
        }
    }

}
