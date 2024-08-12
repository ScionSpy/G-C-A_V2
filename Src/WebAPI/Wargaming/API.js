const { description } = require('../../Discord/Structures/Command');
const WebAPI = require('../index');
const config = require('../apiConfig').Wargaming;
const URI = config.path + '{PATH}/?application_id=' + config.app_id

const API_Errors = {
    'SEARCH_NOT_SPECIFIED': {
        code: 402,
        message:'SEARCH_NOT_SPECIFIED',
        'account/list': { description: "{Search} parameter not specified with no {account_id}" },
    },

    'NOT_ENOUGH_SEARCH_LENGTH': {
        code: 407,
        message: 'NOT_ENOUGH_SEARCH_LENGTH',
        'clans/list': {
            description: '{Search} parameter is not long enough',
            min: 2,
        },
        'account/list': {
            description: '{Search} parameter is not long enough. Allows value depends on {type} parameter.',
            min: 3,
            max: 24
        }
    },

    'SEARCH_LIST_LIMIT_EXCEEDED': {
        code: 407,
        message: 'SEARCH_LIST_LIMIT_EXCEEDED',
        'account/list': { description:"Limit of specified names in {search} parameter exceeded (>100)" }
    },

    'INVALID_SEARCH': {
        code: 407,
        message: 'INVALID_SEARCH',
        'account/list': { description: "{Search} exceeded the allowed 24 characters, or included invalid special characters!" }
    },

    'CLAN_ID_NOT_SPECIFIED': {
        code: 402,
        message: 'CLAN_ID_NOT_SPECIFIED',
        'clans/info': { description: "{Clan_id} not provided in search." }
    }
};

module.exports = class Wargaming_API extends WebAPI {
    constructor(){
        super(config.URL);
    };

    async makeAPICall(path, query){
        if(query.startsWith('&')) query = query.splice(0,1);
        if(!path.endsWith('/')) path = path + '/';
        let request = `${path}?${config.app_id}&${query}`;
        let results;

        try{
            results = await this.__makeRequest(request);
        }catch(err){
            results = err;
        };

        if(config.Debug) console.log(`WargamingAPI.makeAPICall() ->\n`, results);

        return results;
    };

    async handelApiError(err, path){

        if(!API_Errors[err.message]) return JSON.stringify(err, null, 4);
        let API_Error = API_Errors[err.message];
        let Data = {};

        Data.code = API_Error.code;
        Data.message = API_Error.message;
        Data.description = API_Error[path].description
        if (API_Error[path].min || API_Error[path].max) Data.characters = {};
        if (API_Error[path].min) Data.characters ? Data.characters['min'] = API_Error[path].min : Data.characters['min'] = { min: API_Error[path].min };
        if (API_Error[path].max) Data.characters ? Data.characters['max'] = API_Error[path].max : Data.characters['max'] = { max: API_Error[path].max };

        return JSON.stringify(Data, null, 4);
    };
};
