import {logger} from "sequelize/types/utils/logger";
import fs = require('fs');

const request = require('request')
const utils = require('../lib/utils')


const AWSXRay = require('aws-xray-sdk-core')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))

// Create client outside of handler to reuse
const lambda = new AWS.Lambda()

// Handler
exports.handler = async function(event, context) {
    context.log('HTTP trigger function processed a request.');
    const req = context.req;

    context.res = {
        statusCode: 200,
        body: req.body
    };
    const res = context.res;

    if (req.body.imageUrl !== undefined) {
        const url = req.body.imageUrl

        const imageRequest = request.get(url)
            .on('error', function (err: unknown) {
                // UserModel.findByPk(loggedInUser.data.id).then(async (user: UserModel | null) => { return await user?.update({ profileImage: url }) }).catch((error: Error) => { next(error) })
                logger.warn(`Error retrieving user profile image: ${utils.getErrorMessage(err)}; using image link directly`)
            })
            .on('response', function (res: Response) {
                if (res.status === 200) {
                    const ext = ['jpg', 'jpeg', 'png', 'svg', 'gif'].includes(url.split('.').slice(-1)[0].toLowerCase()) ? url.split('.').slice(-1)[0].toLowerCase() : 'jpg'
                    imageRequest.pipe(fs.createWriteStream(`frontend/dist/frontend/assets/public/images/uploads/data.${ext}`))
                    // UserModel.findByPk(loggedInUser.data.id).then(async (user: UserModel | null) => { return await user?.update({ profileImage: `/assets/public/images/uploads/${loggedInUser.data.id}.${ext}` }) }).catch((error: Error) => { next(error) })
                }
                // else UserModel.findByPk(loggedInUser.data.id).then(async (user: UserModel | null) => { return await user?.update({ profileImage: url }) }).catch((error: Error) => { next(error) })
            })
    }
    context.res = {
        status: 400,
        body: "Please pass a name on the query string or in the request body"
    };
}

// Use SDK client
var getAccountSettings = function(){
    return lambda.getAccountSettings().promise()
}

var serialize = function(object) {
    return JSON.stringify(object, null, 2)
}
