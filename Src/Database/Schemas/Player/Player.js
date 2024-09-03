const Constants = require('../../../Constants.js');
const Database = require('../../core.js');


//ToDo: Create JSDoc


module.exports = class Player extends Database {

    constructor(Data){
        super();

        if (!Data.id && !Data.name) throw new Error(`Database.Player(Data); 'data' requires data.id or data.name to load!`);

        this.id = Data.id || null;
        this.name = Data.name || null;

        this.needsLoading = true;
    };

    async load(){
        let query;
        if(this.id) query = {id:this.id};
        else query = {name:this.name};

        let verifiedUser = await this._Get("Verified", query) || null;
        let clanMember = await this._Get("Members", query) || null;
        let admin = await this._Get("Admin", query) || null;

        if(verifiedUser){
            this.id = verifiedUser[0].id;
            this.name = verifiedUser[0].name;
            this.discord_id = verifiedUser[0].discord_id;

        }else{
            this.id = clanMember[0].id;
            this.name = clanMember[0].name;
            this.discord_id = clanMember[0].discord_id;
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


    isRecruiter(){
        if (this.clan && this.clan.id == Constants.GCA.id && Constants.Ranks.Values[this.clan.rank] > 3) return true;
        else return false;
    };


    async setLoA(author = 'G-C-A\'s Client', reason, exempt = false){
        let res;

        if (reason == "null" || reason == "clear") {
            res = await this._Edit("Members", { id: this.id }, { isLoA: false });
            res = await this._Edit("Admin", {id:this.id}, {loa: null});
        }else{
            let loa = {
                auth: author,
                start: Date.now(),
                exempt,
                reason
            };

            await this._Edit("Members", { id: this.id }, { isLoA:true})
            res = await this._Edit("Admin", {id:this.id}, {loa});
        };
        if (res.modifiedCount > 0) res = true;
        else res = false;
        return res;
    };


    async setInactive(author = 'G-C-A\'s Client', reason) {
        if(reason !== 'set' && reason !== 'clear') throw new Error(`Player.setInactive(author, reason); {reason} must be set to 'set' or 'clear'! got ${reason}`);
        let res;

        if (reason == "clear") {
            res = await this._Edit("Members", { id: this.id }, { isInactive: false });
            res = await this._Edit("Admin", { id: this.id }, { isInactive: null });

        } else if(reason == 'set') {
            let inactive = {
                auth: author,
                start: Date.now()
            };

            res = await this._Edit("Members", { id: this.id }, { isInactive: true });
            res = await this._Edit("Admin", { id: this.id }, { inactive });
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
            admin: null
        };

        this.name = name;
        res.members = await this._Edit("Members", { id: this.id }, { name });
        res.verified = await this._Edit("Verified", { id: this.id }, { name });
        res.verified = await this._Edit("Admin", { id: this.id }, { name });

        return res;
    };

    async deactivateMember() {
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
            results = await this.deactivateMember();
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
