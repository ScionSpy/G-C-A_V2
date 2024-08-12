const { defineQuery } = require('../../Utils');
const WargamingAPI = require('../API');
const API = new WargamingAPI();

module.exports = {
    lookup: async function clanLookup(query) {
        if (typeof query !== "string") throw new Error(`WargamingAPI.clanLookup(query)\n  'query' must be a string! got ${typeof query}\n`);
        if (query.length < 2) throw new Error(`WargamingAPI.clanLookup(query)\n  'query' must have a minimum character limit of 2.`);

        let results = await API.makeAPICall('clans/list/', `search=${query}`);

        if (results.status === "error") throw new Error(`WargamingAPI.clanLookup(query) -> `+await API.handelApiError(results.error, 'clans/list'));

        return results.data;
    },


    getDetails: async function getClanDetails(query) {
        if (typeof query !== "string" || query.length < 10) throw new Error(`WargamingAPI.getClanDetails(query)\n  'query' must be a string of clan ID's! got ${typeof query} : length(${query.length}) !== 10\n`);

        let queryData = [[]]
        if (query.includes(',')) queryData = defineQuery(query, 100);
        else queryData[0][0] = query; // "startswith"
        let clans = [];

        for (let x = 0; x < queryData.length; x++) {
            for (let y = 0; y < queryData[x].length; y++) {
                let q = queryData[x][y];
                if (isNaN(q)) throw new Error(`WargamingAPI.getClanDetails(query = '${q}')\n  queries must be a string of Numbers! got ${typeof q} : ${q}\n`);
            };

            let results = await API.makeAPICall('clans/info', `extra=members&clan_id=${queryData[x].join(',')}`);

            if (results.status === "error") throw new Error(`WargamingAPI.getClanDetails(query='${results.error.value}') -> ` + await API.handelApiError(results.error, 'clans/info'));
            else clans = clans.concat(results.data);
        };

        return clans;
    },
};
