const DB = require('../../index.js');
const { Clans } = require('../../../WebAPI/Wargaming/index.js');
const { Ranks } = require('../../../Constants.js');
const Constants = require('../../../Constants.js');
const { Collection } = require('discord.js');

module.exports = class Clan {

    #bot;
    clan_id;
    tag;
    name;
    leader;
    member_ids;
    #ranks;
    discord = null;
    IFF = {};

    /**
     *
     * @param {{id:Number}} data clan data to pull.
     * @param {import('../../../Discord/Structures/BotClient.js')} bot
     * @param {Boolean} preLoad pre-load the data??
     */
    constructor(data, bot, preLoad){
        if ((!data || !data.id) && typeof data.id !== "number") throw new Error(`new DB.Clans(data, bot, preLoad); 'data' must be defined with an 'id' paramater matching a number. got ${typeof data} : ${data}`);
        if (!bot) throw new Error(`new DB.Clans(data, bot, preLoad); 'data' must be defined with an 'id' paramater matching a number. got ${typeof bot}`);
        this.clan_id = data.id || undefined;
        this.#bot = bot;

        if(preLoad) this._Load();
    };

    async setData(data){
        if(data.discord){
            if(data.discord.ranks){
                this.#ranks = data.discord.ranks;
                delete data.discord.ranks;
            };
        };

        for(let key in data){
            this[key] = data[key];
        };

        return this;
    };

    async _Load(){
        let _clan = await Clans.getDetails(this.clan_id);
        let clan = _clan[0][this.clan_id];
        this.tag = clan.tag;
        this.name = clan.name;
        this.leader = { id: clan.leader_id, name:clan.leader_name };
        this.member_ids = clan.members_ids;

        let clanData = await DB._Get("Clans", {id: this.clan_id});
        console.log(clanData);
        this.IFF = clanData[0]?.relations || {};

        if (clanData[0]?.discord){
            this.discord = {};
            let discord = clanData[0].discord;
            if (discord.id) this.discord.id = discord.id;
            if (discord.invite) this.discord.invite = discord.invite;
            if (discord.ranks) this.discord.ranks = discord.ranks;

            if (discord.channels) this.discord.channels = discord.channels;
        };

        return this;
    };

    isGCA(){
        if (this.clan_id !== '1000101905') return false;
        else return true;
    };


    /**
     * @deprecated This function is not yet used, LoA data is still stored in the Members collection under "Member.loa" as an object.
     * @returns
     */
    async getLoAs() {
        if (!this.isGCA()) throw new Error(`Clan.getLoAs(); Is not GCA, aborting action!`);
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
    async getRecruiterStats(sort = { name: false, sent: true, accepted: false, active: false }) {
        if (!this.isGCA()) throw new Error(`Clan.getRecruiterStats(sort = ${JSON.stringify(sort)}); Is not GCA, aborting action!\n`);
        let invites = await this.getInvites();
        let recruiterResults = {};

        for (let x = 0; x < invites.length; x++) {
            let inv = invites[x];
            let inviter = inv.sender.name;
            if (!recruiterResults[inviter]) recruiterResults[inviter] = {name: inviter, sentInvites: 0, acceptedInvites: 0};
            recruiterResults[inviter].sentInvites++;
            if(inv.status == "accepted"){
                recruiterResults[inviter].acceptedInvites++;
                if(sort.active){
                    if (!recruiterResults[inviter].players) recruiterResults[inviter].players = [];
                    recruiterResults[inviter].players.push(`${inv.account.name} [Verified=${this.#bot.Players[this.#bot.PlayersIndex.get(inv.account.id)].discord_id ? '✅' : '❌'}] [isGCA=${this.member_ids.includes(inv.account.id) ? '✅' : '❌'}]`);
                };
            };
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


    async getDivStars() {
        if (!this.isGCA()) throw new Error(`Clan.getDivStars(); Is not GCA, aborting action!\n`);
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

    async getSavedApplications(query = {}) {
        if (!this.isGCA()) throw new Error(`Clan.getSavedApplications(query = ${JSON.stringify(query)}); Is not GCA, aborting action!\n`);
        let apps = await DB._Get("Applications", query);
        return apps;
    };


    /**
     *
     * @param {Array<Number>} MembersToRemove
     */
    async removeMember(MembersToRemove) {
        if (!this.isGCA()) throw new Error(`Clan.removeMember(MembersToRemove = ${MembersToRemove}); Is not GCA, aborting action!\n`);

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

    async getDiscordRoles(rank){
        if(!this.discord.id || !this.#ranks) return null;
        let roles = [];

        for (let x = 0; x < this.#ranks.length; x++){
            if(rank){
                if(this.#ranks[x].tag !== rank) continue;
                roles.push(this.#ranks[x].id);
            } else {
                roles.push(this.#ranks[x].id);
            };
        };

        return roles;
    };


    //#region Clan.Applications

    async getApplications() {
        if (!this.isGCA()) throw new Error(`Clan.getApplications(); Is not GCA, aborting action!\n`);
        let applications = await Clans.getApplications();
        return applications;
    };

    /**
     *
     * @param {Object} data
     * @param {Number} data.id ID of the application, 7 digit number.
     * @param {String} data.status Status to mark this Application as.
     * * Accepts: "accepted" | "declined"
     * @returns
     */
    async #__ApplicationResponse(data) {
        if (!this.isGCA()) throw new Error(`Clan.#__ApplicationResponse(data = ${JSON.stringify(data)}); Is not GCA, aborting action! (Should not fire!!)\n`);
        if (!data || typeof data !== "object") throw new Error(`API.Clans.acceptApplication('data'); {data} must be defined and an object! { id:int, status:str }`);
        if (!data.id || typeof data.id !== "number" || data.id.toString().length !== 7) throw new Error(`API.Clans.acceptApplication('data'); {data.id} must be a number and 7 characters long.`);
        if (!data.status || typeof data.status !== "string") throw new Error(`API.Clans.acceptApplication('data'); {data.status} must be defined as a string! got ${typeof data.status} : ${data.status}`);
        if (data.status !== "accepted" && data.status !== "declined") throw new Error(`API.Clans.acceptApplication('data'); {data.status} must be one of 'accepted' or 'declined'! got ${data.status}`);

        let results = await Clans.sendApplicationResponse({ id: data.id, status: data.status });
        return results;
    };

    async acceptApplication(id = undefined) {
        if (!this.isGCA()) throw new Error(`Clan.acceptApplication(id = ${id}); Is not GCA, aborting action!\n`);
        let result = await this.#__ApplicationResponse({ id, status: "accepted" });
        if (result.type) return result;
        else return { status: 'accepted', result };
    };

    async declineApplication(id = undefined) {
        if (!this.isGCA()) throw new Error(`Clan.declineApplication(id = ${id}); Is not GCA, aborting action!\n`);
        let result = await this.#__ApplicationResponse({ id, status: "declined" });
        if (result.type) return result;
        else return { status: 'declined', result };
    };

    //#endregion

    //#region Clan.Invites

    async getInvites() {
        if (!this.isGCA()) throw new Error(`Clan.getInvites(); Is not GCA, aborting action!\n`);
        let clanInvites = await Clans.getInvites({ getAll: true });
        return clanInvites;
    };


    /**
     *
     * @param {Object} data
     * @param {String} data.name Player Name
     * @param {Number} data.id Player account ID
     */
    async getInviteFor(data) {
        if (!this.isGCA()) throw new Error(`Clan.getInviteFor(data = ${JSON.stringify(data)}); Is not GCA, aborting action!\n`);
        if (!data || typeof data !== "object") throw new Error(`Clan.getInviteFor(data); 'data' must be defined and an object. got ${typeof data}`);
        if (!data.name && !data.id) throw new Error(`Clan.getInvitesFor(data); 'data' must have one of either 'data.name' as a String or 'data.id' as a Number. Got ${JSON.stringify(data, null, 4)}.`);
        if (data.name && typeof data.name !== "string") throw new Error(`Clan.getInviteFor(data); 'data.name' must be a string! Got ${typeof data.name}`);
        if (data.id && typeof data.name !== "number") throw new Error(`Clan.getInviteFor(data); 'data.id' must be a Number! got ${typeof data.id}`);

        let inviteData;

        let clanInvites = await this.getInvites();
        for (let x = 0; x < clanInvites.length; x++) {
            let invite = clanInvites[x];

            if (data.name && invite.account.name === data.name) inviteData = invite;
            else if (data.id && invite.account.id === data.id) inviteData = invite;

            if (inviteData) break;
        };

        return inviteData;
    };

    //#endregion

};
