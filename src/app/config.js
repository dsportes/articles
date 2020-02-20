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

const lgn = 32

function decore (data) {
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

    let x = data['code-barre'].substring(0, 7) + '000000'
    let cb = []
    for (let i = 0; i < 13; i++) {
        cb[i] = x.charCodeAt(i) - 48
    }
    data.cb = cb

    let nom = ['', '']
    let j = 0
    let nx = data.nom.trim().split(' ')
    nx.splice(0, 0, '[' + data.codeCourt + ']')
    for (let i = 0; i < nx.length && j < 2; i++) {
        let m = nx[i]
        if (nom[j].length + m.length + 1 < lgn) {
            if (nom[j].length) {
                nom[j] = nom[j] + ' ' + m
            } else {
                nom[j] = m
            }
        } else {
            j++
            if (j < 2) {
                nom[j] = m
            }
        }
    }
    data.nom1 = nom[0]
    data.nom2 = nom[1]
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
