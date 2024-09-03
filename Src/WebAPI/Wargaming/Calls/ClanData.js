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
 * @typedef {Object} ApplicationData
 * @property {String} game 'wows' for world of warships
 * @property {String} status active | expired | accepted | declined
 * @property {Date} expires_at Time at which the invite expires.
 * @property {Number} id WoWs Account ID *
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

/**
 * @typedef {Object} Application.Conf
 * @property {Number} clan_id
 * @property {Number} id Application ID
 * @property {Number} account_id
 */
/**
 * @typedef {Object} Application.ConfErr
 * @property {String} title Error Title
 * * APPLICATION_IS_NOT_ACTIVE |
 * @property {String} description Description of the error.
 * @property {Object} additional_data
 */
/**
 * @typedef {Object} Application.ConfErr.APPLICATION_IS_NOT_ACTIVE
 * @property {String} title Error Title
 * @property {String} description Description of the error.
 * @property {Object} additional_data
 * @property {String} additional_data.status Status of Application
 * * "accepted" | "declined" | "expired"
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


/**
 * @typedef {Object} DivStars
 * @property {Array<String>} clanClanstarsCount Key Value pair of each members DivStars in-clan. key = account ID. (See DivStars/Clan Results)
 * @property {Array<DivStars.accountClanstars>} accountClanstars
 * @property {Array<DivStars.AccountRewards>} accountRewards
 * @property {Array<DivStars.RewardsInfo>} rewardsInfo key = stars needed for the reward. value = reward gained.
 */
/**
 * @typedef {Object} DivStars.accountClanstars
 * @property {Number} spaId Player ID of the user this div star was gotten from.
 * @property {Number} clanId Clan ID of the clan this divStar was obtained from.
 * @property {String} questId Mission ID this star was completed for.
 * * '1335c9ba-5e05-4cc2-a25c-10fc3a563e60' = "Win a Battle"
 */
/**
 * @typedef {Object} DivStars.AccountRewards
 * @property {Number} id
 * @property {Number} spaId
 * @property {Number} clanId
 * @property {Number} clanstarsCount
 * @property {String} status
 * @property {Date} claimedAt Date this reward was claimed at.
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {Number} seasonId
 */
/**
 * @typedef {Object} DivStars.RewardsInfo
 * @property {String} type Type of reward gained
 * * 'lootbox'|'signal'|elite_xp'|'steel'|'oil'
 * @property {Number|Null} id ID of the item-type rewarded.
 * @property {Number} amount Number of this type given.
 * @property {Null|Undefined} customisation
*/

const { Auth_Token } = require('../../apiConfig').Wargaming;

module.exports = {

    /**
     * @requires {String} Authorization Token
     * @returns {Array<ApplicationData>}
     */
    getApplications: async function getInviteApplications(){
        let query = "battle_type=pvp&order=-updated_at&offset=0&limit=100";

        let auth = Auth_Token; //DB.getAuthToken({name:"ShadowSpyy"});
        let Cookies = `wsauth_token=${auth}`;

        let results = await API.makeAPICall('api/recruitment/active_clan_applications/', query, Cookies);

        if(results.applications) return results.applications;
        else return results;
    },

    acceptApplicationError: async function (results) {
        const additionalInfo = results.additional_info || {};
        const reason = (results.title || '').toLowerCase();

        let errorResponse = '';
        switch (reason) {
            case 'account_banned':
                errorResponse = "Applicant's account is permamently banned.";
                break;

            case 'account_in_cooldown':
                errorResponse = "Applicant's is currently on clan_cooldown. | " + additionalInfo.expires_at;
                break;

            case 'application_is_not_active':
                errorResponse = `Applicant's application is no longer active. ${additionalInfo.status ? ` | ${additionalInfo.status}` : ''}`;
                break;

            case 'account_already_in_clan':
                errorResponse = "Applicant has joined a different clan.";
                break;

            case 'insufficient_permissions':
                errorResponse = "You do not have permission to accept this application. Please accept from in-game or using the [browser](https://clans.worldofwarships.com/requests).| <@213250789823610880> Your Auth_Token has expired!!";
                break;

            case 'clan_is_full':
                errorResponse = "G-C-A does not have sufficiant space for this member! Our clan is full!";
                break;

            default:
                errorResponse = "Unknown Error: ```js\n" + JSON.stringify(results, null, 4) + "\n```";
        };

        let Data = {
            title: results.title,
            description: results.description,
            decodedResponse: errorResponse
        };
        Data.additional_info = results.additional_info ? results.additional_info : undefined;

        Data.decodedResponse = errorResponse;
        return Data;
    },

    declineApplicationError: async function (results) {
        const reason = results.additional_info?.reason;
        let errorResponse = '';
        if (reason === 'application_is_not-Active') {
            errorResponse = `Applicant's application is no longer active. ${additionalInfo.status ? ` | ${additionalInfo.status}` : ''}`;

        } else if (reason === 'account_already_in_clan') {
            errorResponse = "Applicant has joined a different clan.";

        } else {
            errorResponse = "Unknown Error: ```js\n" + JSON.stringify(results, null, 4) + "\n```";
        };

        let Data = {
            title: results.title,
            description: results.description,
            decodedResponse: errorResponse
        };
        Data.additional_info = results.additional_info ? results.additional_info : undefined;

        Data.decodedResponse = errorResponse;
        return Data;
    },

    /**
     * @requires {String} Authorization Token
     * @param {Object} data
     * @param {Number} data.id
     * @param {String} data.status Status to send.
     * * "Accepted" | "declined"
     * @returns {Application.Conf|Application.ConfErr}
     */
    sendApplicationResponse: async function(data){
        let auth = Auth_Token; //DB.getAuthToken({name:"ShadowSpyy"});
        let Cookies = `wsauth_token=${auth}`;

        let results = await API.makeApiCall_PATCH('api/recruitment/applications/' + data.id + '/', { status: data.status }, Cookies);

        if(results.title || results.error){
            if(data.status === "accepted") return await this.acceptApplicationError(results);
            else return results; //await this.declineApplicationError(results);
        } else return results;
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

    /**
     *
     * @returns {DivStars}
     */
    getDivStars: async function getDivisionStars(){
        let auth = Auth_Token; //DB.getAuthToken({name:"ShadowSpyy"});
        let Cookies = `wsauth_token=${auth}`;

        let divStars = await API.makeAPICall('api/clanstars/get_account_state/', '', Cookies);

        return divStars;
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



    /**
     *
     * @param {Array<Number} members
     */
    removeMembers: async function (clan_id, members) {
        if(typeof members !== "object") throw new Error(`API.Clans.removeMembers(members); 'members' must be an array of numbers! got ${typeof members} : ${members}`);

        let auth = Auth_Token; //DB.getAuthToken({name:"ShadowSpyy"});
        let Cookies = `wsauth_token=${auth}`;

        let body = {user_ids: members};

        let results = await API.makeApiCall_POST('api/members/{clan_id}/remove_members/'.replace('{clan_id}', clan_id), body, Cookies);
        return results;
    },
};
