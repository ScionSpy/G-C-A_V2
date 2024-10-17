const { GuildMember } = require('discord.js');
const Constants = require('../../../Constants.js');
const Player = require('./Player.js');


//ToDo: Create JSDoc


module.exports = class DiscordPlayer extends Player {

    /** @type {GuildMember} */
    #guildMember;
    #bot

    constructor(Data, bot){
        if (!bot || typeof bot != "object") throw new Error(`Database.DiscordPlayer(Data, bot); 'bot' must be defined as a Discord Client instance! `);
        if (!Data.id && !Data.name && !Data.discord_id) throw new Error(`Database.DiscordPlayer(Data, bot); Player requires an Data.id or Data.name or Data.discord_id to load!`);
        super(Data, bot);

        this.#bot = bot;
        this.needsLoading = true;
    };

    async setDiscordData(data){
        await this.setData(data);
        delete this.setData;

        try {
            let member = await this.#bot.guilds.cache.get(Constants.GCA.discord_id).members.cache.get(this.discord_id);
            this.#guildMember = member;

        } catch (err) {
            if (err.message === "Unknown Member") {
                let player = new Player(this, this.#bot);
                player = await player.setData(data);
                return player;

            } else {
                console.log(JSON.stringify(err, null, 4));

                this.#guildMember = null;
                throw new Error(`Database.DiscordPlayer.load(); Error! ${err}`);
            };
        };

        delete this.needsLoading;
        delete this.setDiscordData;
        delete this.load;
        delete this.loadDiscord;
        return this;
    };

    async loadDiscord(){
        await this.load();
        delete this.load;

        try {
            let member = await this.#bot.guilds.cache.get(Constants.GCA.discord_id).members.fetch(this.discord_id);
            this.#guildMember = member;

        }catch(err){
            if (err.message === "Unknown Member") {
                let player = new Player(this, this.#bot);
                player = await player.load();
                return player;

            } else {
                console.log(JSON.stringify(err, null, 4));

                this.#guildMember = null;
                throw new Error(`Database.DiscordPlayer.load(); Error! ${err}`);
            };
        };

        delete this.needsLoading;
        delete this.setDiscordData;
        delete this.loadDiscord;
        return this;
    };

    #cannotEdit(action){
        this.#bot.channels.cache.get('1168784020109266954').send(`<@213250789823610880>,\n Cannot edit <@!${this.discord_id}>!\n> ${JSON.stringify(action, null, 4)}`);
        throw new Error(`Cannot edit Member!`);
    };

    getDiscordUser(){
        return this.#guildMember;
    };

    /**
     * Adds the provided {role_ids} from the player.
     * @param {String[]} role_ids
     * @param {String} reason
     * @returns {Promise<import('discord.js').GuildMember>}
     */
    async addRoles(role_ids, reason){
        if (!this.#guildMember.manageable) return this.#cannotEdit({ action: 'addRole', role_ids, reason });

        let roles = [];
        for (let x = 0; x < role_ids.length; x++) {
            let role = await this.#guildMember.guild.roles.cache.get(role_ids[x]);
            roles.push(role);
        };

        try{
            let status = await this.#guildMember.roles.add(roles, reason);
            return status;
        }catch(err){
            throw new Error(`Database.DiscordPlayer.addRole(); Error! ${err}`);
        };
    };

    /**
     * Removes the provided {role_ids} from the player.
     * @param {String[]} role_ids
     * @param {String} reason
     * @returns {Promise<import('discord.js').GuildMember>}
     */
    async removeRoles(role_ids, reason) {
        if (!this.#guildMember.manageable) return this.#cannotEdit({ action: 'removeRole', role_ids, reason });

        let roles = [];
        for(let x = 0; x < role_ids.length; x++){
            let role = await this.#guildMember.guild.roles.cache.get(role_ids[x]);
            roles.push(role);
        };

        try {
            let status = await this.#guildMember.roles.remove(roles, reason);
            return status;
        } catch (err) {
            throw new Error(`Database.DiscordPlayer.removeRole(); Error! ${err}`);
        };
    };

    /**
     * Adds clan rank to this user.
     * @returns {Promise<import('discord.js').GuildMember>}
     */
    async addMemberRole(rank) {
        if(!this.clan.id || !rank) return null;

        let clan = await this.getClan();
        let role = await clan.getDiscordRoles(rank);
        
        if(role) return await this.addRoles(role);
        else return false;
    };

    /**
     * Removes all clan rank from this user.
     * @returns {Promise<import('discord.js').GuildMember>}
     */
    async removeMemberRole(rank) {
        if (!this.clan.id) return null;

        let clan = await this.getClan();
        let roles = await clan.getDiscordRoles(rank);

        return await this.removeRoles(roles);
    };

    async editNickname(name, reason) {
        if (!this.#guildMember.manageable) return this.#cannotEdit({ action: 'editNickname', name, reason });
        try {
            let status = await this.#guildMember.setNickname(name, reason);
            return status;
        } catch (err) {
            throw new Error(`Database.DiscordPlayer.removeRole(); Error! ${err}`);
        };
    };
};
