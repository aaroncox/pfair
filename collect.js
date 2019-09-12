// usage: node collect.js > data.csv

const { JsonRpc } = require('eosjs')
const ecc = require('eosjs-ecc')
const fetch = require('node-fetch')
const rpc = new JsonRpc('https://eos.greymass.com', { fetch })

const contract = 'eosbetdice11'
const batch_size = 500
const keys = [
    'bet_id',
    'bettor',
    // 'amt_contract',
    'bet_amt',
    'payout',
    // 'seed',
    // 'signature',
    'roll_under',
    'random_roll',
]

function sig2roll(sig) {
    // https://gitlab.com/EOSBetCasino/eosbetdice_public/blob/master/EOSBetDice.cpp#L219
    const type = Buffer.alloc(1, 0) // signature struct header, 0 = K1
    const data = new ecc.Signature.fromString(sig).toBuffer()
    const hash = Buffer.from(ecc.sha256(Buffer.concat([type, data])), 'hex')
    const roll = ((hash[0] + hash[1] + hash[2] + hash[3] + hash[4] + hash[5] + hash[6] + hash[7]) % 100) + 1
    return roll
}

async function main() {
    const head = await rpc.history_get_actions(contract)
    const headSec = head.actions[head.actions.length - 1].account_action_seq
    let seq = 0
    let seen = new Set()
    process.stdout.write(`${keys.join(',')}\n`)
    while (true) {
        process.stderr.write(`${seen.size} bets - ${((seq / headSec) * 100).toFixed(4)}% (${seq}/${headSec}) \n`)
        const { actions } = await rpc.history_get_actions(contract, seq, batch_size)
        actions
            .map(({ action_trace }) => action_trace.act)
            .filter(({ name }) => name === 'betreceipt')
            .forEach(({ data }) => {
                if (!seen.has(data.bet_id)) {
                    seen.add(data.bet_id)
                    if (data.random_roll !== sig2roll(data.signature)) {
                        process.stderr.write(`${data.bet_id} does not verify: ${data.signature} ${data.random_roll}\n`)
                    }
                    process.stdout.write(`${keys.map((k) => data[k]).join(',')}\n`)
                }
            })
        if (actions.length > 0) {
            seq = actions[actions.length - 1].account_action_seq
        } else {
            break
        }
    }
    process.stderr.write('done\n')
}

main().catch((error) => process.stderr.write(`error: ${error.message}\n`))
