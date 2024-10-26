const Constants = require('../../../Constants.js');
const Database = require('../../core.js');
const { Clans, Players} = require('../../../WebAPI/Wargaming/index.js');

//ToDo: Create JSDoc


module.exports = class Player extends Database {


    #bot;
    #clan;

    constructor(Data, client){
        super();

        if (!Data.id && !Data.name && !Data.discord_id) throw new Error(`Database.Player(Data, client); 'data' requires data.id or data.name or data.discord_id to load!`);
        if (!client) throw new Error(`Database.Player(Data, client); 'client' is required. got ${typeof client}`);

        this.#bot = client;

        this.id = Data.id || null;
        this.name = Data.name || null;
        this.discord_id = Data.discord_id || null;

        this.needsLoading = true;
    };


    async setData(data) {
        if(data.clan){
            this.#clan = data.clan.clan;
            delete data.clan.clan;
        };

        for (let key in data) {
            this[key] = data[key];
        };

        delete this.needsLoading;
        return this;
    };

    async getClan(){
        if (!this.#clan) return false;
        return this.#clan;
    };


    /**
     *
     * @param {import('../../../WebAPI/Wargaming/Calls/ClanData.js').Clan_Member} player Member joining the Clan.
     * @param {import('../../../WebAPI/Wargaming/Calls/ClanData.js').InviteData} inviteData invite the member joined with.
     */
    async _create(player, inviteData){
        if (typeof player !== "object") throw new Error(`Database.Player.create(player, inviteData); 'player' must be an object! got ${typeof player} : ${player}`);
        if (typeof inviteData !== "object") throw new Error(`Database.Player.create(player, inviteData); 'inviteData' must be an object! got ${typeof inviteData} : ${inviteData}`);

        let memberData = {
            active: true,
            id: player.account_id,
            clan_id: inviteData.sender.clan_id,
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
    };


    async _createPlayer(){
        if (!this.id && this.name) {
            let player = await Players.lookup(this.name);
            if (!player[0]) throw new Error(`Database.Player._createPlayer();    Cannot create player! !{player.id} && {player.name} not found on the WG.API`);
            if (player[0] !== this.name) throw new Error(`Database.Player._createPlayer();    Cannot create player! {player.name} does not match any specifc name, although does start ${player.list} names!`);
            this.id = player[0].account_id;
        } else if (!this.id && !this.name) throw new Error(`Database.Player._createPlayer();    Cannot create player! One of {player.id}(Number) or {player.name}(String) must be defined!`);

        // Fetch data for this ID.
        // Also creates a "Players" and "Admin" entry.
        await this.#setData();

        return this;
    };

    async _load(){
        let query;

        if (this.id) query = { id: this.id };
        else if (this.name) query = { name: this.name };
        else query = { discord_id: this.discord_id };

        let member = this._Get("Players", query);
        if (!member[0]) return await this._createPlayer();

        this.id = member[0].id;

        await this.#setData(member[0]);

        return this;
    };

    async #setData(dbMember){

        let playerData = await Players.getDetails(this.id.toString());
        let player = playerData[0][this.id];

        let playerClanData = await Players.getClanInfo(this.id.toString());
        let clanData = playerClanData[0][this.id];

        if (!this.name) this.name = player.nickname;
        this.discord_id = this.discord_id || null;
        this.clan = null;
        let stats = {
            inactive: null,
            loa: null,
            created_at: player.created_at,
            lastBattle: player.last_battle_time,
            lastLogOut: player.logout_at,
            //duration: int
        };

        if (dbMember){
            stats.inactive = dbMember.inactive || null;
            stats.loa = dbMember.loa || null;
        };

        if (!player.hidden_profile) {
            stats.battles = player.statistics.battles;
            stats.distance = player.statistics.distance;
        };

        this.stats = stats;

        if (clanData.clan_id) {
            let Clan = await this.#bot.Clans[this.#bot.ClansIndex.get(clanData.clan_id.toString())];
            if (!Clan) {
                // ToDo: Add clan to Database and Cache.
                Clan = await Clans.getDetails(clanData.clan_id.toString());
                Clan = Clan[0][clanData.clan_id]
            };
            this.clan = {
                id: clanData.clan_id,
                joined: clanData.joined_at,
                rank: clanData.role,
            };
            if (Clan) {
                if (Clan.tag) this.clan.tag = Clan.tag;
            };
        };

        console.log(this.lastModified);
        // Update database to "Current" info.

        let data = {
            id: this.id,
            name: this.name,
            discord_id: this.discord_id,
            clan: this.clan,
            stats: this.stats,
        };

        await this._Edit("Players", { id: this.id }, data);
        if (clanData.clan_id) await this.#verifyAdmin();

        let index = this.#bot.Players.length;
        this.#bot.Players.push(this);
        this.#bot.PlayersIndex.set(this.id, index);
        this.#bot.PlayersIndex.set(this.name, index);
        this.#bot.PlayersIndex.set(this.name.toLowerCase(), index);
        if (this.discord_id) this.#bot.PlayersIndex.set(this.discord_id, index);

        delete this.needsLoading;
        return this;
    };

    async #verifyAdmin(){
        // Verifiy that this clan is subscribed to the bot.
        let Clan = await this._Get("Clans", {id: this.clan.id});
        if (!Clan[0] || !Clan[0].subscribed) return null;

        // Verify this member has an admin sheet under this particular clan.
        let admin = await this._Get("Admin", { id: this.id, clan_id: this.clan.id });
        if (!admin[0]) admin = await this._Post("Admin", {
            id: this.id,
            clan_id: this.clan.id,
            name: this.name,
            discord_exempt: false,
            dmLocked: false,
            LoA: [],
            inactive: [],
            notes: []
        });
        return admin;
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
            discord_id: verifiedData[0].discord_id,
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
        if (this.clan && this.clan.id == Constants.GCA.id && this.#bot.Ranks[this.#bot.RanksIndex.get(this.clan.rank)].rank < 3) return true;
        else return false;
    };


    isRecruiter(exact) {
        if (this.clan && this.clan.id == Constants.GCA.id) {
            if (!exact && this.#bot.Ranks[this.#bot.RanksIndex.get(this.clan.rank)].rank > 3) return true;
            else if (exact && this.#bot.Ranks[this.#bot.RanksIndex.get(this.clan.rank)].rank == 3) return true;
            else false;
        } else return false;
    };


    isXO(exact) {
        if (this.clan && this.clan.id == Constants.GCA.id){
            if (!exact && this.#bot.Ranks[this.#bot.RanksIndex.get(this.clan.rank)].rank > 4) return true;
            else if (exact && this.#bot.Ranks[this.#bot.RanksIndex.get(this.clan.rank)].rank == 4) return true;
            else false;
        } else return false;
    };


    isCO() {
        if (this.clan && this.clan.id == Constants.GCA.id && this.#bot.Ranks[this.#bot.RanksIndex.get(this.clan.rank)].rank == 5) return true;
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
