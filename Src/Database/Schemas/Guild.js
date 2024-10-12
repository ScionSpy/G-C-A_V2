const DB = require('../index.js');

const GuildMember = require('discord.js').GuildMember;
const DiscordGuild = require('discord.js').Guild;
const BotClient = require('../../Discord/Structures/BotClient.js');
const Clan = require('./Clan/_Clan.js');


const { DEFAULT_PREFIX } = require("../../config.js");

/**
 * @typedef {Object} GuildData
 * @property {String} name Guild Name
 * @property {GuildMember} owner Guild Owner
 * @property {Date} joinedAt Date upon the Client joining the server.
 * @property {Date} leftAt Date upon the Client leaving the server.
 * @property {Number} bots How many bots on the server?
 */

/**
 * @typedef {Object} TicketCategories
 * @property {Boolean} id
 * @property {String} name
 * @property {Array<String>} staff_roles
 */

/**
 * @typedef {Object} Ticket
 * @property {String} ticket.log_channel
 * @property {Number} ticket.limit
 * @property {Array<TicketCategories>} ticket.categories
 */

/**
 * @typedef {Object} GuildType
 * @property {String} id Guild ID
 * @property {GuildData} data Guild info
 * @property {String} prefix Client Custom Prefix on this Guild.
 *
 * @property {Ticket} ticket Information regarding the ticket system.
 */


module.exports = class Guild {

    #bot;
    #guild;
    #status; // Wether the bot is in this server or not.
    id;
    prefix = DEFAULT_PREFIX;
    channels = {};

    clan_id;
    #invite;
    #clan;

    /**
     * @param {DiscordGuild} data
     * @param {BotClient} bot
     * @param {Boolean} useSetData Uses 'data' as is, by-passing all checks and setting values as-is. (Good for pre-handeled data!)
     */
    constructor(data, bot, useSetData) {
        if (!data || typeof data !== "object") throw new Error(`new Database.Guild(data, bot); {data} must be defined as an object! got ${typeof data} : ${JSON.stringify(data, null, 4)}`);
        if (!bot || !(bot instanceof BotClient)) throw new Error(`new Database.Guild(data, bot); {bot} must be defined as an instance of {DBotClient}! got ${bot.constructor}`);
        this.initializing = true;
        this.#bot = bot;

        if(useSetData) return this.#setData(data);

        if (!(data instanceof DiscordGuild)) { // data is not a Discord Guild class.
            // Verify if we have an ID.
            if (!data.id || isNaN(data.id)) throw new Error(`new Database.Guild(data, bot); {data} must be an instance of a {discord.Guild} class, or {data.id} must be Number formatted as a string ('1234567890')! got ${typeof data} : ${JSON.stringify(data, null, 4)}`);
            // We do have an ID, since that's all we've got to work on, let's try to pull this Guild from Discord!
            return this.#getGuild();

        }; // data is an instance of a Discord Guild class!

        return this.#collectData(data);
    };

    async #collectData(guild){
        this.id = guild.id;
        this.ownerID = guild.ownerID || null;
        this.#guild = guild;
        let clan = await DB._Get("Clans", {'discord.id':guild.id});
        let GuildServer = await DB._Get("GuildSettings", { id:guild.id });

        if(clan[0]){
            this.#status = clan.status;
            this.clan_id = clan[0].clan_id;
            this.#clan = guild.client.Clans[guild.client.ClansIndex.get(this.clan_id.toString())];
        };

        if (GuildServer[0].discord){
            if (GuildServer[0].discord.invite) this.#invite = GuildServer[0].discord.invite;
            if (GuildServer[0].discord.channels) this.channels = GuildServer[0].discord.channels;
        };

        delete this.initializing;
        return this;
    };

    async #setData(data) {
        if (!data || typeof data !== "object") throw new Error(`Database.Guild.setData(data); {data} must be defined as an object! got ${typeof data} : ${JSON.stringify(data, null, 4)}`);

        for (let key in data) {
            this[key] = data[key];
        };

        delete this.initializing;
        return this;
    };

    async save(extras){
        let data = {
            active: this.#status || true,
            id: this.id,
            prefix: this.prefix,
            clan_id: this.clan_id || null
        };

        let discord = {};
        if (this.#invite) discord.invite = this.#invite;
        if (this.channels) discord.channels = this.channels;


        if (discord.invite || discord.channels) data.discord = discord;

        if(extras){
            for (let key in extras) {
                data[key] = extras[key];
            };
        };
        console.log(data);

        let saved = await DB._Edit("GuildSettings", { id: this.id }, data);
        if (saved) return saved;
        else throw new Error(`Database.Guild.save(); Error saving Guild to database! ${JSON.stringify(this, null, 4)}\n${saved}`);
    };

    async #getGuild() {
        let guild = await this.#bot.guilds.fetch(this.id);
        if (!guild) throw new Error(`Database.Guild.#getGuild(); No Discord Guild fetched with an id of ${this.id}!\n\n ${err.stack}`);
        else this.#collectData(guild);
    };

    async toggleClan(status){
        if(status === undefined) status = !this.#status;
        this.#status = status;
        await this.save();
        return this;
    };

    /**
     * Binds this Guild to a clan.
     * @param {*} clanData
     * @returns
     */
    async setClan(clanData) {
        let clan = await new Clan(clanData, true);
        if (!clan) return false;
        this.#clan = clan;
        return await this.save();
    };

    /**
     * Fetched this guild's clan.
     * @returns
     */
    async getClan(){
        return this.#clan;
    };



    async setInvite(){
        return false;
    };

    async getInvite(){
        return this.#invite;
    };

    async setWowsCodes(chID){
        if (!this.channels) this.channels = {};

        if(chID == 'clear' || chID == 'null'){
            this.channels.codeGiveAways = null;
            if(this.channels.codeGiveAways){
                let index = his.#bot.riftChannels.codeGiveAways.indexOf(this.channels.codeGiveAways);
                this.#bot.riftChannels.codeGiveAways.splice(index, 1);
            };

        }else{
            try{
                let ch = await this.#guild.channels.cache.get(chID);
                if (!ch) return new Error(`Guild.setWowsCodes(chID = ${chID}); is not a valid channel on guild ${this.#guild.id}!`);
                this.channels.codeGiveAways = chID;
                this.#bot.riftChannels.codeGiveAways.push(ch.id);
            } catch(err){
                throw new Error(err.stack);
            };
        };

        await this.save();
        return this;
    };
};
