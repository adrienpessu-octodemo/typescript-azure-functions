import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { upper } from "case"

import utils = require('../lib/utils')
const challenges = require('../data/datacache').challenges
const db = require('../data/mongodb')

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const id = utils.disableOnContainerEnv() ? String(req.params.id).replace(/[^\w-]+/g, '') : req.params.id

    context.res = {};
    const res = context.res;

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
    context.res = {
        // status: 200, /* Defaults to 200 */
        body: upper(`Hello, ${name}!`)
    };
};

export default httpTrigger;
