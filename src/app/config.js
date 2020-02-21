const path = require('path')
const fs = require('fs')
const csv = require('csv-parser')
const remote = require('electron').remote

class Config {
    quit () {
        remote.BrowserWindow.getFocusedWindow().close()
    }
}
export const config = new Config()

let dir

try {
    const argv = remote.process.argv
    for (let i = 0; i < argv.length; i++) {
        const x = argv[i]
        if (x && x.startsWith('dir=')) {
            dir = x.substring(4)
            break
        }
    }
    if (!dir) { dir = require('os').homedir() + '/balance' }
    config.dir = path.normalize(dir)
    const rawdata = fs.readFileSync(path.join(config.dir, 'config.json'))
    const obj = JSON.parse(rawdata)
    for (let f in obj) { config[f] = obj[f] }
} catch (e) {
    const err = {
        type: 'error',
        buttons: ['Lu'],
        message: 'Configuration config.json incorrecte ou non trouvée dans ' + config.dir,
        detail: e.message
    }
    remote.dialog.showMessageBoxSync(err)
    config.quit()
}

const backup = {}

export function restaurer (id) {
    let bk = backup[id]
    if (!bk) { return null }
    let a = JSON.parse(bk)
    decore(a)
    return a
}

function decore (data) {
    backup[data.id] = JSON.stringify(data)
    const n = parseInt(data.id, 10)
    // 'A' = 65
    const l1 = String.fromCharCode((n % 26) + 65)
    const l2 = String.fromCharCode((Math.floor(n / 26) % 26) + 65)
    data.codeCourt = l2 + l1
    if (data.unite.startsWith('U')) {
        let i = data.nom.lastIndexOf('//')
        if (i === -1) {
            data.poidsPiece = 0
        } else {
            const x = data.nom.substring(i + 2)
            const p = parseInt(x, 10)
            data.poidsPiece = isNaN(p) ? 0 : p
            data.nom = data.nom.substring(0, i)
        }
    } else {
        data.poidsPiece = -1
    }

    data.bio = data.nom.toUpperCase().indexOf('BIO') !== -1

    data.prixN = parseFloat(data.prix)
    if (Number.isNaN(data.prixN)) { data.prixN = 0 }

    data.codebarre6 = data['code-barre'].substring(1, 7)
    normalisecb (data)
}

function normalisecb (data) {
    let cb = data['code-barre']
    if (!cb || cb.length !== 13 || cb.charAt(0) !== '0') {
        data.erreur.push('Le code barre doit avoir 13 chiffres et ')
        return
    }
    data.codebarre6 = data['code-barre'].substring(1, 7)
    let v = data.codebarre6
    if (v.length !== 6) {
        data.erreur.push('Le code barre doit avoir 6 chiffres')
        return
    }
    for (let i = 0; i < 6; i++) {
    let c = v.charAt(i)
    if (c < '0' || c > '9') {
        data.erreur.push('Le code barre doit avoir 6 chiffres')
        return
    }

    let x = '0' + data.codebarre6 + '000000'
    let ean = []
    for (let i = 0; i < 13; i++) { ean[i] = x.charCodeAt(i) - 48 }
    data['code-barre'] = editEan(ean, data.codebarre6)
}

function editEan(ean, p) {
    let s = '00000' + p
    s = s.substring(s.length - 5)
    for (let i = 4; i >= 0; i--) {
        ean[i + 7] = s.charCodeAt(i) - 48
    }
    let x = 0
    for (let i = 10; i >= 0; i = i - 2) { x += ean[i] }
    let y = 0
    for (let i = 11; i >= 0; i = i - 2) { y += ean[i] }
    let z = (3 * y) + x
    let r = z % 10
    let c = 0
    if (r !== 0) {
        let q = Math.floor(z / 10) + 1
        c = (q * 10) - z
    }
    ean[12] = c

    let res = ''
    for (let i = 0; i < 13; i++) {
        res += String.fromCharCode(48 + ean[i])
    }
    return res
}


// CSV : id nom code-barre prix unite image
export function lectureArticles(cb) {
    let articles = []
    const rs = fs.createReadStream(config.articles)
    rs.on('error', (e) => {
        cb(e.message)
    })
    try {
        rs.pipe(csv({ separator: ';' }))
        .on('data', (data) => {
            decore(data)
            articles.push(data)
        })
        .on('end', () => {
            cb(null, articles)
        })
        rs.on('error', (e) => {
            cb(e.message)
        })
    } catch (e) {
        cb(e.message)
    }
}
