const DB = require('../index.js');
const { Clans } = require('../../WebAPI/Wargaming/index.js');

module.exports = class Clan {

    constructor(data){
        this.clan_id = data.id || undefined;
    };


    async getLoAs(){
        let loaMembers = await DB._Get("Members", {isLoA:true}, {id:1, name:1});
        let loaList = [];
        for(let x = 0; x<loaMembers.length;x++){
            let Admin = await DB._Get("Admin", {id: loaMembers[x].id});
            loaList.push({
                id: Admin.id,
                name: Admin.name,
                discordExempt: Admin.discordExempt,
                loa: Admin.loa,
                note: Admin.note
            });
        };

        return loaList;
    };


    async getInvites(){
        let clanInvites = await Clans.getInvites({getAll:true});
        return clanInvites;
    };


    /**
     *
     * @param {Object} data
     * @param {String} data.name Player Name
     * @param {Number} data.id Player account ID
     */
    async getInviteFor(data){
        if (!data || typeof data !== "object") throw new Error(`Clan.getInviteFor(data); 'data' must be defined and an object. got ${typeof data}`);
        if (!data.name && !data.id) throw new Error(`Clan.getInvitesFor(data); 'data' must have one of either 'data.name' as a String or 'data.id' as a Number. Got ${JSON.stringify(data, null, 4)}.`);
        if (data.name && typeof data.name !== "string") throw new Error(`Clan.getInviteFor(data); 'data.name' must be a string! Got ${typeof data.name}`);
        if (data.id && typeof data.name !== "number") throw new Error(`Clan.getInviteFor(data); 'data.id' must be a Number! got ${typeof data.id}`);

        let inviteData;

        let clanInvites = await this.getInvites();
        for(let x = 0; x < clanInvites.length; x++){
            let invite = clanInvites[x];

            if (data.name && invite.account.name === data.name) inviteData = invite;
            else if (data.id && invite.account.id === data.id) inviteData = invite;

            if(inviteData) break;
        };

        return inviteData;
    };


    stats = {
        _this: this,

        /**
         * @typedef {Object} InviteLeaderboard
         * @property {String} name Name of the recruiter.
         * @property {Number} sentInvites Number of invites this recruiter has sent.
         * @property {Number} acceptedInvites Number of invites this recruiter sent that were accepted.
        */
        /**
         * @param {Object} sort Paramaters to sort by. If multiple are provided Sent takes priority followed by accepted, then name.
         * @param {Boolean} sort.sent Sort by number of invites sent. (Default Sorting)
         * @param {Boolean} sort.name Sort by Senders name.
         * @param {Boolean} sort.accepted Sort by number of invites accepted.
         * @returns {Array<InviteLeaderboard>} Recruiter Leaderboard
         */
        getRecruiterStats: async function(sort = {name:false, sent:true, accepted:false}){
            let invites = await this._this.getInvites();
            let recruiterResults = {};

            for (let x = 0; x < invites.length; x++) {
                let inv = invites[x];
                let inviter = inv.sender.name;
                if (!recruiterResults[inviter]) recruiterResults[inviter] = {name: inviter, sentInvites: 0, acceptedInvites: 0};
                recruiterResults[inviter].sentInvites++;
                if(inv.status == "accepted") recruiterResults[inviter].acceptedInvites++;
            };

            let leaderboard = [];
            for(let key in recruiterResults){
                leaderboard.push(recruiterResults[key]);
            };
            if (sort.sent) leaderboard.sort((a, b) => b.sentInvites - a.sentInvites || a.name.localeCompare(b.name) || b.acceptedInvites - a.acceptedInvites);
            else if (sort.accepted) leaderboard.sort((a, b) => b.acceptedInvites - a.acceptedInvites || a.name.localeCompare(b.name) || b.sentInvites - a.sentInvites);
            else if (sort.name) leaderboard.sort((a, b) => a.name.localeCompare(b.name) || b.sentInvites - a.sentInvites || b.acceptedInvites - a.acceptedInvites);

            return leaderboard;
        }
    }
};
