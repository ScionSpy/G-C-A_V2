const https = require('https');
const { containsLink } = require('../Discord/Helpers/Utils');
const config = require('./apiConfig');
const _URL = require('url-parse');

module.exports = class WebApp {
    constructor(URI){
        if (typeof URI !== "undefined" && (typeof URI !== "string" || !containsLink(URI))) throw new Error(`WebApp: URI must be a URL String! got ${typeof URI} : ${typeof URI !== "undefined" ? URI : undefined}`);
        this.URI = URI;
    };

    async __makeRequest(URL, Cookies){
        if (!this.URI && !containsLink(URL)) throw new Error(`WebApp: URI must be a URL String! got ${typeof URI} : ${typeof URI !== "undefined" ? URI : undefined}`);

        let _this = this;
        let url = new _URL(URL)
        const options = {
            host: url.host,
            url: URL,
            path: url.pathname + url.query,
            method: 'GET',
            'User-Agent': 'GCA_ClientServer',
        };
        if (Cookies) options.headers = { Cookie: Cookies };

        let Data;
        let promise = new Promise(function (res, rej) {
            if(config.DEBUG.all || config.DEBUG.out) console.log(`WebAPI: Request: ${URL}`);

            const request = https.request(options, (response) => {
                let data = '';
                response.on('data', (chunk) => {
                    data = data + chunk.toString();
                });

                response.on('end', () => {
                    try{
                        const body = JSON.parse(data);
                        Data = body;
                        //Data = data;
                        if (config.DEBUG.all || config.DEBUG.in) console.log(JSON.stringify(Data, null, 4));
                        if (Data.status == 'error') rej(Data);
                        res(Data);
                    }catch(err){
                        rej({error:err.message, body: data});
                    };
                });
            })

            request.on('error', (error) => {
                console.log('An error', error);
                rej(error);
            });

            request.end()
        });

        return promise;
    };
};
