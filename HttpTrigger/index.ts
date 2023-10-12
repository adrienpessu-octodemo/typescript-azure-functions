import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import fs = require('fs')

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request.');
    if (req.body.imageUrl !== undefined) {
        const url = req.body.imageUrl
        if (url.match(/(.)*solve\/challenges\/server-side(.)*/) !== null) req.app.locals.abused_ssrf_bug = true
        
        const imageRequest = req.get(url)
            .on('error', function (err: unknown) {
                console.log(`Error retrieving user profile image: ${utils.getErrorMessage(err)}; using image link directly`)
            })
            .on('response', function (res: Response) {
                const ext = ['jpg', 'jpeg', 'png', 'svg', 'gif'].includes(url.split('.').slice(-1)[0].toLowerCase()) ? url.split('.').slice(-1)[0].toLowerCase() : 'jpg'
                imageRequest.pipe(fs.createWriteStream(`frontend/dist/frontend/assets/public/images/uploads/data.${ext}`))
                context.res = {
                    // status: 200, /* Defaults to 200 */
                    body: "Hello " + (req.query.name || req.body.name)
                };
            })
      }
      context.res = {
        status: 400,
        body: "Please pass a name on the query string or in the request body"
    };

};

export default httpTrigger;
