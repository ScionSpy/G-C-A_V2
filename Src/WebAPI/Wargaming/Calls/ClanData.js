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

/**
 * @typedef {Object} InviteData
 * @property {String} game 'wows' for world of warships
 * @property {String} status active | expired | accepted | declined
 * @property {Date} expires_at Time at which the invite expires.
 * @property {Number} id WoWs Account ID
 *
 * @property {Object} sender User who sent the invite.
 * @property {Number} sender.clan_id ID of the Sender's clan.
 * @property {Number} sender.id Account ID for the Sender.
 * @property {Boolean} sender.is_banned Is the sender currently banned from WoWs?
 * @property {String} sender.role The Sender's role in the clan.
 * @property {String} sender.name The Sender's name.
 *
 *
 * @property {Object} account Information regarding the invitee.
 * @property {Number|Null} account.clan_id Invitee's current clan ID.
 * @property {Array<>} account.bans Invitees previous bans.
 * @property {Number} account.id Invitee's Account ID.
 * @property {Date} account.in_clan_cooldown_till Is the Invitee currently in clan cooldown?
 * @property {Boolean} account.is_banned Is the Invitee Banned?
 * @property {String} account.name Invitee's name.
 *
 * @property {Object} statistics Stats of the player being invited
 * @property {Number} statistics.btl Number of account battles.
 * @property {Number} statistics.afb Average Frags per Battle.
 * @property {Number} statistics.aeb Average EXP per Battle.
 * @property {Number} statistics.rank 0-17, 17 = Clan Battle Access.
 * @property {Number|Null} statistics.season_rank
 * @property {Number} statistics.season_id
 * @property {Number} statistics.wb Win Rate
 * @property {Number} statistics.admg Average Damage per Battle.
 * @property {Number} statistics.abd
 *
 * @property {String|Null} comment
 * @property {Boolean} is_hidden_statistics
 * @property {Date} updated_at Time at which the invite was last updated.
 * @property {Boolean} is_banned
 * @property {Date} created_at Time at which the invite was created.
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
     * @returns {Array<InviteData>}
     */
    getInvites: async function getInvite(data = {page: 1, pageCount: 30, getAll: false}) {
        if (data.getAll === undefined && data.page === undefined && data.pageCount === undefined) throw new Error(`WargamingAPI.Clans.getInvites({page, pageCount, getAll}); either both of {page} and {pageCount} need be defined as numbers or {getAll} as a boolean. got undefined on all.`);
        if (typeof data.getAll !== "undefined" && typeof data.getAll !== "boolean") throw new Error(`WargamingAPI.Clans.getInvites({page, pageCount, getAll}); {getAll} must be undefined or a Boolean. got ${typeof data.getAll}`);
        if (data.getAll === undefined && typeof data.page !== "number") throw new Error(`WargamingAPI.Clans.getInvites({page, pageCount, getAll}); {page} must be number! got ${typeof data.page}`);
        if (data.getAll === undefined && typeof data.pageCount !== "number") throw new Error(`WargamingAPI.Clans.getInvites({page, pageCount, getAll}); {page} must be number! got ${typeof data.pageCount}`);

        if (data.page === 0) data.page = 1;
        if (data.pageCount > 100) data.pageCount = 100;

        callAPI = async function(query){

            let auth = "hP9sI4SqE7SZR_6PFNrkegcmpaTMFbTYkMXQ6HGZhcjJxXDuvR8cw4MZyPBA5Zp6"; //await DB.getAuthToken({name:"ShadowSpyy"});
            let Cookies = `wsauth_token=${auth}`;

            let results = await API.makeAPICall('api/recruitment/clan_invites/', query, Cookies);
            return results;
        };

        /** @type {InviteData} */
        let results;
        if(data.getAll){

            let baseQuery = `battle_type=pvp&order=-updated_at&offset={OFFSET}&limit={LIMIT}`;

            invites = [];
            let metaLength = 99;
            for(let page = 0; page*100 < metaLength; page++){
                let query = new String(baseQuery.replace('{OFFSET}', page * 100).replace('{LIMIT}', 100));

                let dataPack = await callAPI(query);
                if(dataPack._meta_.total > metaLength) metaLength = dataPack._meta_.total;
                invites = invites.concat(dataPack.invites);
            };

            return invites;
        } else {
            let query = `battle_type=pvp&order=-updated_at&offset=${(data.page * data.pageCount) - data.pageCount}&limit=${data.pageCount}`;

            results = await callAPI(query);
        };

        if (results.invites) return results.invites;
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
     * @param {String} query
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
