const { defineQuery } = require('../../Utils');
const WargamingAPI = require('../API');
const API = new WargamingAPI();


/**
 * @typedef {Object} Clan_Member
 * @property {Number} account_id
 * @property {String} account_name
 * @property {Number} joined_at
 * @property {String} role
*/

/**
 * @typedef {Object} Clan_Info
 * @property {Number} clan_id
 * @property {String} tag
 * @property {String} name
 * @property {Number} creator_id
 * @property {String} creator_name
 * @property {Number} leader_id
 * @property {String} leader_name
 * @property {Boolean} is_clan_disbanded
 * @property {Number | Null} renamed_at
 * @property {String | Null} old_tag
 * @property {String | Null} old_name
 * @property {Number} updated_at
 * @property {Number} members_count
 * @property {Array<Number>} members_ids
 * @property {Array<Clan_Member>} members
 * @property {String} description
*/




module.exports = {

    getApplications: async function getInviteApplications(){
        let query = "battle_type=pvp&order=-updated_at&offset=0&limit=100";
        let auth = "hP9sI4SqE7SZR_6PFNrkegcmpaTMFbTYkMXQ6HGZhcjJxXDuvR8cw4MZyPBA5Zp6"; //DB.getAuthToken({name:"ShadowSpyy"});

        let Cookies = `wsauth_token=${auth}`;

        let results = await API.makeAPICall('api/recruitment/active_clan_applications/', query, Cookies);

        if(results.applications) return results.applications;
        else return results;
    },

    /**
     *
     * @param {Number} page Page to display; Default: 1
     * @param {Number} pageCount entires per page.; Default: 30, Max: 100
     * @returns Array
     */
    getInvites: async function getInvite(page = 1, pageCount = 30) {
        if (typeof page !== "number") throw new Error(`WargamingAPI.Clans.getInvites(page, pageCount); {page} must be number! got ${typeof page}`);
        if (typeof pageCount !== "number") throw new Error(`WargamingAPI.Clans.getInvites(page, pageCount); {page} must be number! got ${typeof pageCount}`);

        if(page === 0) page = 1;
        if(pageCount > 100) pageCount = 100;

        let query = `battle_type=pvp&order=-updated_at&offset=${(page*pageCount)-pageCount}&limit=${pageCount}`;
        let auth = "hP9sI4SqE7SZR_6PFNrkegcmpaTMFbTYkMXQ6HGZhcjJxXDuvR8cw4MZyPBA5Zp6"; //DB.getAuthToken({name:"ShadowSpyy"});

        let Cookies = `wsauth_token=${auth}`;

        let results = await API.makeAPICall('api/recruitment/clan_invites/', query, Cookies);

        if (results.applications) return results.applications;
        else return results;
    },

    lookup: async function clanLookup(query) {
        if (typeof query !== "string") throw new Error(`WargamingAPI.clanLookup(query)\n  'query' must be a string! got ${typeof query}\n`);
        if (query.length < 2) throw new Error(`WargamingAPI.clanLookup(query)\n  'query' must have a minimum character limit of 2.`);

        let results = await API.makeAPICall('wows/clans/list/', `search=${query}`);

        if (results.status === "error") throw new Error(`WargamingAPI.clanLookup(query) -> `+await API.handelApiError(results.error, 'clans/list'));

        return results.data;
    },

    /**
     *
     * @param {*} query
     * @returns {Array<Array<Clan_Info>>}
     */
    getDetails: async function getClanDetails(query) {
        if (typeof query !== "string" || query.length < 10) throw new Error(`WargamingAPI.getClanDetails(query)\n  'query' must be a string of clan ID's! got ${typeof query} : length(${query.length}) !== 10\n`);

        let queryData = [[]]
        if (query.includes(',')) queryData = defineQuery(query, 100);
        else queryData[0][0] = query; // "startswith"
        /**
         * @type {Array<Clan_Info>}
         */
        let clans = [];

        for (let x = 0; x < queryData.length; x++) {
            for (let y = 0; y < queryData[x].length; y++) {
                let q = queryData[x][y];
                if (isNaN(q)) throw new Error(`WargamingAPI.getClanDetails(query = '${q}')\n  queries must be a string of Numbers! got ${typeof q} : ${q}\n`);
            };

            let results = await API.makeAPICall('wows/clans/info', `extra=members&clan_id=${queryData[x].join(',')}`);

            if (results.status === "error") throw new Error(`WargamingAPI.getClanDetails(query='${results.error.value}') -> ` + await API.handelApiError(results.error, 'clans/info'));
            else clans = clans.concat(results.data);
        };

        return clans;
    },
};
