const https = require('https');
const { containsLink } = require('../Discord/Helpers/Utils');
const config = require('./apiConfig');

module.exports = class WebApp {
    constructor(URI){
        if (typeof URI !== "string" || !containsLink(URI)) throw new Error(`WebApp: URI must be a URL String! got ${typeof URI} : ${typeof URI !== "undefined" ? URI : undefined}`);
        this.URI = URI;
    };

    async __makeRequest(URL){
        let _this = this;

        let Data;
        let promise = new Promise(function (res, rej) {
            if(config.DEBUG.all || config.DEBUG.out) console.log(`WebAPI: Request: ${_this.URI+URL}`);
            const request = https.request(_this.URI+URL, (response) => {
                let data = '';
                response.on('data', (chunk) => {
                    data = data + chunk.toString();
                });

                response.on('end', () => {
                    const body = JSON.parse(data);
                    Data = body;
                    //Data = data;
                    if (config.DEBUG.all || config.DEBUG.in) console.log(JSON.stringify(Data, null, 4));
                    if (Data.status == 'error') rej(Data);
                    res(Data);
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
