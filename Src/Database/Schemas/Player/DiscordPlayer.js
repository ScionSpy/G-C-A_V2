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
        super(Data);

        this.#bot = bot;
        this.needsLoading = true;
    };

    async loadDiscord(){
        await this.load();
        delete this.load;

        try {
            let member = await this.#bot.guilds.cache.get(Constants.GCA.discord_id).members.fetch(this.discord_id);
            this.#guildMember = member;

        }catch(err){
            this.#guildMember = null;
            throw new Error(`Database.DiscordPlayer.load(); Error! ${err}`);
        };

        delete this.needsLoading;
        delete this.loadDiscord;
        return this;
    };

    #cannotEdit(action){
        return this.#bot.channels.cache.get('1168784020109266954').send(`<@213250789823610880>,\n Cannot edit <@!${this.discord_id}>!\n> ${JSON.stringify(action, null, 4)}`);
    };

    getDiscordUser(){
        return this.#guildMember;
    };

    async addRole(role_id, reason){
        if (!this.#guildMember.manageable) return this.#cannotEdit({action:'addRole', role_id, reason});
        let role = await this.#guildMember.guild.roles.cache.get(role_id);
        try{
            let status = await this.#guildMember.roles.add(role, reason);
            return status;
        }catch(err){
            throw new Error(`Database.DiscordPlayer.addRole(); Error! ${err}`);
        };
    };

    async removeRole(role_id, reason) {
        if (!this.#guildMember.manageable) return this.#cannotEdit({ action: 'removeRole', role_id, reason });
        let role = await this.#guildMember.guild.roles.cache.get(role_id);
        try {
            let status = await this.#guildMember.roles.remove(role, reason);
            return status;
        } catch (err) {
            throw new Error(`Database.DiscordPlayer.removeRole(); Error! ${err}`);
        };
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
