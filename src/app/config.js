const path = require('path')
const fs = require('fs')
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
    if (rawdata) {
        const obj = JSON.parse(rawdata)
        for (let f in obj) { config[f] = obj[f] }
    }
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
