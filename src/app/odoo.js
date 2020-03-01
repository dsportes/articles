const Odoo = require('node-odoo')

export function testOdoo () {
    const odoo = new Odoo({
    host: 'vps765607.ovh.net',
    port: 8069,
    database: '88a20dba-25ce-11ea-bd52-fa163ea10aed',
    username: 'daniel@sportes.fr',
    password: 'stopogm_2019'
    })

    // Connect to Odoo
    odoo.connect(function (err) {
    if (err) { return console.log(err) }

    // Get a partner
    odoo.get('res.partner', 4, function (err, partner) {
        if (err) { return console.log(err) }

        console.log('Partner', partner)
    })
    })
}
