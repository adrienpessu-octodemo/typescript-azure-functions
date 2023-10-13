import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { upper } from "case"

import utils = require('../lib/utils')
import * as path from "path";
const challenges = require('../data/datacache').challenges
const db = require('../data/mongodb')
const utils = require('../lib/utils')
const security = require('../lib/insecurity')
const challenges = require('../data/datacache').challenges

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const id = utils.disableOnContainerEnv() ? String(req.params.id).replace(/[^\w-]+/g, '') : req.params.id

    context.res = {};
    const res = context.res;
    let file = req.params.file

    utils.solveIf(challenges.reflectedXssChallenge, () => { return utils.contains(id, '<iframe src="javascript:alert(`xss`)">') })
    db.orders.find({ $where: `this.orderId === '${id}'` }).then((order: any) => {
        const result = utils.queryResultToJson(order)
        utils.solveIf(challenges.noSqlOrdersChallenge, () => { return result.data.length > 1 })
        if (result.data[0] === undefined) {
            result.data[0] = { orderId: id }
        }
        res.json(result)
    }, () => {
        res.status(400).json({ error: 'Wrong Param' })
    })
    if (file && (endsWithAllowlistedFileType(file) || (file === 'incident-support.kdbx'))) {
        file = security.cutOffPoisonNullByte(file)

        utils.solveIf(challenges.directoryListingChallenge, () => { return file.toLowerCase() === 'acquisitions.md' })
        verifySuccessfulPoisonNullByteExploit(file)

        res.sendFile(path.resolve('ftp/', file))
    } else {
        res.status(403)
        next(new Error('Only .md and .pdf files are allowed!'))
    }
};


function verifySuccessfulPoisonNullByteExploit (file: string) {
    utils.solveIf(challenges.easterEggLevelOneChallenge, () => { return file.toLowerCase() === 'eastere.gg' })
    utils.solveIf(challenges.forgottenDevBackupChallenge, () => { return file.toLowerCase() === 'package.json.bak' })
    utils.solveIf(challenges.forgottenBackupChallenge, () => { return file.toLowerCase() === 'coupons_2013.md.bak' })
    utils.solveIf(challenges.misplacedSignatureFileChallenge, () => { return file.toLowerCase() === 'suspicious_errors.yml' })

    utils.solveIf(challenges.nullByteChallenge, () => {
        return challenges.easterEggLevelOneChallenge.solved || challenges.forgottenDevBackupChallenge.solved || challenges.forgottenBackupChallenge.solved ||
            challenges.misplacedSignatureFileChallenge.solved || file.toLowerCase() === 'encrypt.pyc'
    })
}

function endsWithAllowlistedFileType (param: string) {
    return utils.endsWith(param, '.md') || utils.endsWith(param, '.pdf')
}

export default httpTrigger;
