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
import { removeDiacritics, editEAN, formatPrix, dateHeure } from './global'
const Stream = require('stream')

export const enteteCSV = '"id";"nom";"code-barre";"prix";"unite";"image"\n'

const csv = require('csv-parser')
const fs = require('fs')
const path = require('path')
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier

const dir = config.dir
const archivesPath = path.join(dir, 'archives')
const modelesPath = path.join(dir, 'modèles')
const articlesPath = path.join(dir, 'articles.csv')
const maxArch = config.nbMaxArchives ? config.nbMaxArchives : 10
const header = [
    { id: 'id', title: 'id' },
    { id: 'nom', title: 'nom' },
    { id: 'code-barre', title: 'code-barre' },
    { id: 'prix', title: 'prix' },
    { id: 'unite', title: 'unite' },
    { id: 'image', title: 'image' }
]
let reference = []

export function eq(a1, a2) {
 return a1.nom === a2.nom &&
    a1.id === a2.id &&
    a1['code-barre'] === a2['code-barre'] &&
    a1.prix === a2.prix &&
    a1.unite === a2.unite &&
    a1.image === a2.image
}

export function eqRef(articles) {
    if (articles.length !== reference.length) { return false }
    for (let i = 0; i < articles.length; i++) {
        if (!eq(reference[i], articles[i])) { return false }
    }
    return true
}

export function listeArchMod(arch) {
    let lst = []
    fs.readdirSync(arch ? archivesPath : modelesPath).forEach(file => {
        if (file.endsWith('.csv')) { lst.push(file) }
    })
    lst.sort((a, b) => a > b ? 1 : (a < b ? -1 : 0))
    if (arch && lst.length > maxArch) {
        for (let i = maxArch - 1; i < lst.length; i++) {
            fs.unlinkSync(path.join(archivesPath, lst[i]))
        }
        lst.splice(maxArch, lst.length - maxArch)
    }
    return lst
}

export function clone(data) {
    return JSON.parse(JSON.stringify(data))
}

export function copieFichier(nom, p) {
    return new Promise((resolve, reject) => {
        const data = fs.readFileSync(p, 'utf8', (err) => { reject(err) })
        fs.writeFileSync(path.join(modelesPath, nom), data, (err) => { reject(err) })
        resolve()
    })
}

/*
Si nom est présent et ne commence pas par $ : c'est soit une archive, soit un modèle
Si nom == '$S' : fichier récupéré du serveur central (sélection d'articles de ODOO).
Si nom == '$N' : c'est un nouveau fichier vide.
Si nom est absent : c'est le fichier actuellement en service sur les balances (le dernier envoyé)
*/

export class Fichier {
    constructor (nom, arch) {
        this.nom = nom && nom.endsWith('.csv') ? nom.substring(0, nom.length - 4) : nom
        this.arch = arch
        if (this.nom) {
            if (this.nom === '$S') {
                this.label = 'fichier importé du central'
            } else if (this.nom === '$N') {
                this.label = 'fichier vide'
            } else if (arch) {
                this.label = 'archive [' + nom + ']'
                this.path = path.join(archivesPath, this.nom + '.csv')
            } else {
                this.label = 'modèle [' + nom + ']'
                this.path = path.join(modelesPath, this.nom + '.csv')
            }
        } else {
            this.label = 'dernier fichier mis en service'
        }
        this.articles = []
        this.articlesI = []
        this.nbcrees = 0
        this.nbmodifies = 0
        this.nbsupprimes = 0
        this.nberreurs = 0
    }

    detruire () {
        if (this.nom) { fs.unlinkSync(this.path) }
    }

    /*
    Si n est présent, le sauver en tant que modèle
    si envoi est true, l'envoyer aux balances si différent de la référence : l'écrire en archive ET sur articles.csv
    */
    ecrire (n, envoi) {
        let na = []
        for (let i = 0; i < this.articles.length; i++) {
            let x = this.articles[i]
            if (x.status <= 2) {
                na.push(x)
                x.status = 0
            }
        }
        this.articles = na
        this.stats()
        let aEnvoyer = envoi && !eqRef(na)
        return new Promise((resolve, reject) => {
            const csvStringifier = createCsvStringifier({ header: header, fieldDelimiter: ';' })
            const s = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(na)
            let a
            if (this.nom && !this.arch && !n) {
                // c'est un modele à sauver en son nom
                fs.writeFileSync(path.join(modelesPath, this.nom + '.csv'), s, (err) => { reject(err) })
            }
            if (n) {
                // c'est n'importe quoi à sauver comme modèle
                fs.writeFileSync(path.join(modelesPath, n + '.csv'), s, (err) => { reject(err) })
            }
            if (aEnvoyer) {
                // le contenu diffère de celui en service : mettre en archives et dans aricles.csv
                a = dateHeure()
                fs.writeFileSync(articlesPath, s, (err) => { reject(err) })
                fs.writeFileSync(path.join(archivesPath, a + '.csv'), s, (err) => { reject(err) })
            }
            resolve(a)
        })
    }

    /*
    Si le fichier a pour nom $S l'argument source est le string obtenu par import des données du serveur central (ODOO).
    Dans les autres cas, soucre est absent.
    Si le fichier est $N, la source est constituée de la seule entête CSV.
    Sinon le contenu est lu depuis le fichier dont le path a été défini au constructor (nom arch)
    */
    async lire (source) {
        return new Promise((resolve, reject) => {
            let stream
            if (this.nom.startsWith('$')) {
                stream = new Stream()
                if (this.nom === '$S') {
                    stream.emit('data', source)
                } else {
                    stream.emit(enteteCSV)
                }
            } else {
                stream = fs.createReadStream(this.path)
            }
            let n = 0
            this.erreur = false
            let ref = []
            stream.on('error', (e) => {
                reject(e)
            })
            try {
                stream.pipe(csv({ separator: ';' }))
                .on('data', (data) => {
                    if (!this.nom) { ref.push(data) }
                    n++
                    data.n = n
                    this.articlesI.push(data)
                    data.status = 0
                    this.decore(data)
                    this.articles.push(data)
                })
                .on('end', () => {
                    reference = ref
                    this.stats()
                    resolve(this.articles)
                })
                stream.on('error', (e) => {
                    reject(e)
                })
            } catch (e) {
                reject(e)
            }
        })
    }

    stats () {
        this.nbcrees = 0
        this.nbmodifies = 0
        this.nbsupprimes = 0
        this.nberreurs = 0
        for (let i = 0; i < this.articles.length; i++) {
            let a = this.articles[i]
            if (a.erreurs.length) { this.nberreurs++ }
            if (a.status === 1 || a.status === 4) { this.nbcrees++ }
            if (a.status === 2) { this.nbmodifiees++ }
            if (a.status === 3 || a.status === 4) { this.nbsupprimes++ }
        }
        return this.nbcrees + this.nbmodifies + this.nbsupprimes
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
        if (!prix || typeof prix !== 'number' || prix < 0 || prix > 999999) {
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
        if (val !== 'Unité(s)' && val !== 'kg') {
            return 'unite doit valoir "Unité(s)" ou "kg"'
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

        e = this.majId (data, data.id)
        if (e) { data.erreurs.push(e) }

        e = this.majUKg (data, data.unite)
        if (e) { data.erreurs.push(e) }

        try {
            e = parseFloat(data.prix)
            if (e < 0 || e > 999999) {
                data.erreurs.push('prix absent ou < 0 ou > 999999')
            } else {
                data.prixN = e
            }
        } catch (err) {
            data.erreurs.push('prix absent ou < 0 ou > 999999')
        }
    }
}
