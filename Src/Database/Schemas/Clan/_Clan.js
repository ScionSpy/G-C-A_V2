const DB = require('../../index.js');
const { Clans } = require('../../../WebAPI/Wargaming/index.js');
const { Ranks } = require('../../../Constants.js');

module.exports = class Clan {

    clan_id;
    tag;
    name;
    leader;
    founder;
    members;
    member_ids;

    constructor(data){
        if ((!data || !data.id) && typeof data.id !== "number") throw new Error(`new DB.Clans(data); 'data' must be defined with an 'id' paramater matching a number. got ${typeof data} : ${data}`);
        this.clan_id = data.id || undefined;

        this._Load();
    };

    async _Load(){
        let _clan = await Clans.getDetails(this.clan_id);
        let clan = _clan[0][this.clan_id];
        this.tag = clan.tag;
        this.name = clan.name;
        this.leader = { id: clan.leader_id, name:clan.leader_name };
        this.founder = { id:clan.creator_id, name:clan.creator_name };
        this.members = clan.members;
        this.member_ids = clan.members_ids;

        return this;
    };

    applications = require('./applications.js');
    invites = require('./invites.js');


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
    getRecruiterStats = async function(sort = {name:false, sent:true, accepted:false}){
        let invites = await this.invites.getInvites();
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
    };


    getDivStars = async function(){
        let divStars = await Clans.getDivStars();
        let members = await DB._Get("Members", {}, {id:1, name:1, clan_role:1})

        let DivStars = [];

        for(let key in divStars.clanClanstarsCount){
            let Player = await members.find((Member) => Member.id == Number(key));
            DivStars.push({ stars: divStars.clanClanstarsCount[key], Rank: Ranks.Shorts[Player.clan_role], name: Player.name });
        };

        DivStars.sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name) || b.Rank - a.Rank);

        return { users: DivStars.length, counts:DivStars };
    };

    getSavedApplications = async function(query = {}){
        let apps = await DB._Get("Applications", query);
        return apps;
    };


    /**
     *
     * @param {Array<Number>} MembersToRemove
     */
    async removeMember(MembersToRemove){

        if(typeof MembersToRemove === "string"){
            MembersToRemove = MembersToRemove.split(',');

            let list = [];
            for(let x = 0; x<MembersToRemove.length; x++){

                for(let key in this.members){
                    if(this.members[key].account_name === MembersToRemove[x]) list.push(key);
                };

            };
            MembersToRemove = list;
        };

        let res = await Clans.removeMembers(this.clan_id, MembersToRemove);
        await this._Load();
        return res;
    };
};
