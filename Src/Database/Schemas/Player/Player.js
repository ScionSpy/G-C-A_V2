const Constants = require('../../../Constants.js');
const Database = require('../../core.js');


//ToDo: Create JSDoc


module.exports = class Player extends Database {

    constructor(Data){
        super();

        if (!Data.id && !Data.name && !Data.discord_id) throw new Error(`Database.Player(Data); 'data' requires data.id or data.name or data.discord_id to load!`);

        this.id = Data.id || null;
        this.name = Data.name || null;
        this.discord_id = Data.discord_id || null;

        this.needsLoading = true;
    };

    /**
     *
     * @param {import('../../../WebAPI/Wargaming/Calls/ClanData.js').Clan_Member} player Member joining the Clan.
     * @param {import('../../../WebAPI/Wargaming/Calls/ClanData.js').InviteData} inviteData invite the member joined with.
     */
    async create(player, inviteData){
        if (typeof player !== "object") throw new Error(`Database.Player.create(player, inviteData); 'player' must be an object! got ${typeof player} : ${player}`);
        if (typeof inviteData !== "object") throw new Error(`Database.Player.create(player, inviteData); 'inviteData' must be an object! got ${typeof inviteData} : ${inviteData}`);

        let existingData = {
            memberData: await this._Get("Member", {id:player.account_id}),
            verifiedData: await this._Get("Verified", { id: player.account_id }),
            adminData: await this._Get("Admin", { id: player.account_id }),
        };

        console.log(existingData)

        if(
            existingData.memberData ||
            existingData.verifiedData ||
            existingData.adminData
        ){
            throw new Error(`Database.Player.create(player, inviteData); Attempted to create data for existing ID ${player.account_id}\n> Player : ${JSON.stringify(player, null, 4)}\n> inviteData : ${JSON.stringify(inviteData, null, 4)}`);
        };

        let memberData = {
            active: true,
            id: player.account_id,
            name: player.account_name,
            inviter: {
                id: inviteData.sender.id,
                name: inviteData.sender.name,
            },
            clan_role: player.role,
            clan_joined: player.joined_at,
            clan_left: null,
            duration: null,
            last_logOut: null,
            last_battle: null,
            battles: null,
        };

        if(!inviteData.is_hidden_statistics){
            memberData.battles = inviteData.statistics.btl;
        };

        let adminData = {
            id: player.account_id,
            discord: {
                exempt: false,
                dmLocked: null
            },
            inactive: null,
            loa: null,
            notes: null
        };

        await this._Post("Members", memberData);
        await this._Post("Admin", adminData);

        this.id = memberData.id;
        this.name = memberData.name;
        this.discord_id = null;
        this.clan = {};
        this.clan.id = inviteData.sender.clan_id;
        this.clan.tag = "G-C-A";
        this.clan.rank = player.role;
        this.clan.active = true

        this.stats = {};
        this.stats.inactive = false;
        this.stats.loa = false;
        this.stats.joined = player.joined_at;
        this.stats.lastLogOut = null;
        this.stats.lastBattle = null;
        this.stats.battles = memberData?.battles || -1;

        return this;
    };

    async load(){
        let query;

        if (this.id) query = {id:this.id};
        else if (this.name) query = {name:this.name};
        else query = {discord_id:this.discord_id};

        let verifiedUser = await this._Get("Verified", query) || null;
        let clanMember = await this._Get("Members", query) || null;
        let admin = await this._Get("Admin", query) || null;

        if(verifiedUser){
            this.id = verifiedUser[0]?.id;
            this.name = verifiedUser[0]?.name;
            this.discord_id = verifiedUser[0]?.discord_id;

        }else if(clanMember){
            this.id = clanMember[0]?.id;
            this.name = clanMember[0]?.name;
            this.discord_id = null;

        } else {
            this.id = this.id;
            this.name = this.name;
            this.discord_id = null;
        };

        if(clanMember){
            if(!clanMember[0].active){
                this.stats = {
                    joined: clanMember[0].clan_joined *1000,
                    left: clanMember[0].clan_left,
                    duration: clanMember[0].clan_left - (clanMember[0].clan_joined *1000),
                    rank: clanMember[0].clan_role,
                };
            }else{


                this.clan = {
                    id: Constants.GCA.id,
                    tag: Constants.GCA.tag,
                    rank: clanMember[0].clan_role,
                    active: clanMember[0].active
                };

                this.stats = {
                    inactive: clanMember[0].inactive,
                    loa: clanMember[0].loa,
                    joined: clanMember[0].clan_joined,
                    lastBattle: clanMember[0].last_battle,
                    lastLogOut: clanMember[0].last_logOut,
                    duration: clanMember[0].duration ? clanMember[0].duration : 0,
                    battles: clanMember[0].battles
                };
            };
        };

        if(admin){
            this.admin = {
                eligible: admin.eligible,
                note: admin.note,
                loa: admin.loa,
                inactive: admin.inactive,
            };
        };

        if (this.needsLoading) delete this.needsLoading;
        return this;
    };


    async fetch(){
        //TODO: Fetch data from the Wargaming API.
    };


    isVerified(){
        if (!this.discord_id) return false;
        else return true;
    };


    isNonComissioned() {
        if (this.clan && this.clan.id == Constants.GCA.id && Constants.Ranks.Values[this.clan.rank] < 3) return true;
        else return false;
    };


    isRecruiter(exact) {
        if (this.clan && this.clan.id == Constants.GCA.id) {
            if (!exact && Constants.Ranks.Values[this.clan.rank] > 3) return true;
            else if (exact && Constants.Ranks.Values[this.clan.rank] == 3) return true;
            else false;
        } else return false;
    };


    isXO(exact) {
        if (this.clan && this.clan.id == Constants.GCA.id){
            if (!exact && Constants.Ranks.Values[this.clan.rank] > 4) return true;
            else if (exact && Constants.Ranks.Values[this.clan.rank] == 4) return true;
            else false;
        } else return false;
    };


    isCO() {
        if (this.clan && this.clan.id == Constants.GCA.id && Constants.Ranks.Values[this.clan.rank] == 5) return true;
        else return false;
    };


    async setLoA(author = 'G-C-A\'s Client', reason) {
        if (typeof author !== "string") throw new Error(`Player.setLoA(author, reason, exempt = false); {author} must be a string! got ${typeof author} : ${author}`);
        if (!reason || typeof reason !== "string") throw new Error(`Player.setLoA(author, reason, exempt = false); {reason} must be defined as a string! got ${typeof reason}${reason ? ' : ' + reason : ''}`);
        let res;

        if (reason == "null" || reason == "clear") {
            res = await this._Edit("Members", { id: this.id }, { isLoA: false });
            let loa = await this._Get("Admin", {id: this.id}, {loa:1});
            if(!loa) throw new Error(`Player.setLoA('clear'); Player is not actively on LoA!`);

            loa = loa[0];
            if (!loa.history) loa.history = [];

            loa.history.push({
                start: loa.active.start,
                end: Date.now(),
                reason: loa.active.reason,
                authedBy: loa.active.authedBy
            });
            loa.active = null;

            res = await this._Edit("Admin", { id: this.id }, { loa });
        }else{
            let loa = {
                start: Date.now(),
                end: null,
                reason,
                authedBy: author
            };

            await this._Edit("Members", { id: this.id }, { isLoA:true})
            res = await this._Edit("Admin", {id:this.id}, {'loa.active': loa});
        };
        if (res.modifiedCount > 0) res = true;
        else res = false;
        return res;
    };

    async setLoaExempt(exempt = false){
        if (typeof exempt !== "boolean") throw new Error(`Player.setLoA(author, reason, exmept = false); {exempt} must be a boolean! got ${typeof exempt} : ${exempt}`);
        let res;
        if (this.admin.loa.exempt != exempt) res = await this._Edit("Admin", {id:this.id}, {"loa.exempt": exempt});
        if(!res) throw new Error(`Player.setLoaExempt(exempt); Failed to modify database entry!\n> ${JSON.stringify(res, null, 4)}`);

        return { loa: exempt };
    };


    /**
     *
     * @param {String} type setInactive sub command.
     * * 'set' or 'clear'
     * @param {Number} [start] Date inactivity started. (Default: Date.now() / 1000)
     * * Paramter should be date since epoch in seconds.
     * @returns
     */
    async setInactive(type, start = Date.now()/1000) {
        if (type !== 'set' && type !== 'clear') throw new Error(`Player.setInactive(type); {type} must be set to 'set' or 'clear'! got ${type}`);
        let res;

        let inactivity = await this._Get("Admin", { id: this.id }, { inactive: 1 });

        if (type == "clear") {
            res = await this._Edit("Members", { id: this.id }, { isInactive: false });
            if (!inactivity) throw new Error(`Player.setInactive('clear'); Player is not inactive!`);

            inactivity = inactivity[0];
            if (!inactivity.history) inactivity.history = [];

            inactivity.history.push({
                start: inactivity.since,
                end: Date.now(),
                duration: (Date.now() - inactivity.since)
            });
            inactivity.duration += inactivity.history[0].duration;
            inactivity.since = null;

            res = await this._Edit("Admin", { id: this.id }, { inactive: inactivity });

        } else if (type == 'set') {
            if (!inactivity) inactivity = {};

            inactivity.since = start;

            res = await this._Edit("Members", { id: this.id }, { isInactive: true });
            res = await this._Edit("Admin", { id: this.id }, { inactive: inactivity });
        };
        if (res.modifiedCount > 0) res = true;
        else res = false;
        return res;
    };

    async setName(name){
        if(typeof name !== "string") throw new Error(`Player.setName(); {name} must be defined as a string! got ${typeof name} : '${name}'`);
        let res = {
            members: null,
            verified: null,
        };

        this.name = name;
        res.members = await this._Edit("Members", { id: this.id }, { name });
        if(this.discord_id) res.verified = await this._Edit("Verified", { id: this.id }, { name });

        return res;
    };

    async #deactivateMember() {
        let res = {
            member: null,
            admin: null
        };
        let remove = {
            loa: false,
            inactive: false
        };

        if(this.stats.inactive) remove.inactive = true;
        if(this.stats.loa && !this.admin.loa.exempt) remove.loa = true;

        let clan_left = Date.now();
        let duration = this.stats.duration + (clan_left - this.stats.joined *1000);

        if(remove.loa && remove.inactive){
            res.member = await this._Edit("Members", { id: this.id }, { isLoA: false, isInactive: false, active: false, clan_left, duration });
            res.admin = await this._Edit("Admin", { id: this.id }, { LoA: null, inactive: null });

        } else if (remove.loa && !remove.inactive) {
            res.member = await this._Edit("Members", { id: this.id }, { isLoA: false, active: false, clan_left, duration });
            res.admin = await this._Edit("Admin", { id: this.id }, { LoA: null });

        } else if (!remove.loa && remove.inactive) {
            res.member = await this._Edit("Members", { id: this.id }, { isInactive: false, active: false, clan_left, duration });
            res.admin = await this._Edit("Admin", { id: this.id }, { inactive: null });
        }else{
            res.member = await this._Edit("Members", { id: this.id }, { active: false, clan_left, duration });
        };

        return res;
    };

    async toggleClanMember(force = undefined, role = "private") {
        if (typeof force !== "boolean" && typeof force !== "undefined") throw new Error(`Player.toggleClanMember(force, role); {force} must be aa boolean, or undefined! got ${typeof force} : ${force}`);

        if (typeof force !== "boolean" && this.clan.id !== Constants.GCA.id) return;

        let status;

        if (force === undefined) status = !this.clan.active;
        else status = force;

        let results;
        if (status == false){
            role = null;
            results = await this.#deactivateMember();
        } else {
            results = await this._Edit("Members", { id: this.id }, { active: status, clan_role: role });
            await this.load();
        };

        return results;
    };

    async toggleDM(unlocked){
        if(typeof unlocked !== "boolean") throw new Error(`[Database.Player.toggleDM(unlocked)] 'unlocked' expected Boolean, got ${typeof unlocked}`);
        let res = await this._Edit("Members", { id: this.id }, { dmLocked: !unlocked });
        return res;
    };
};
