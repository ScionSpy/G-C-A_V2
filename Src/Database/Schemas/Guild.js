const { DEFAULT_PREFIX } = require("../../config.js");
const { getUser } = require("./User");
const { GuildMember, Guild } = require('discord.js');
const DB = require('../index.js');

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


class _Guild {

    prefix = DEFAULT_PREFIX;

    constructor() {
        this.initializing = true;

    };

    /**
     *
     * @param {GuildType} options
     */
    async create(options) {
        if (!options.id || typeof options.id !== "string") throw new Error(`Guild class constructor requires an ID! { id:string }`);

        for (let key in options) {
            this[key] = options[key];
        };

        delete this.initializing;
        return await DB._Post("GuildSettings", this);
    };

    async load(id) {
        if (!id || typeof id !== "string") throw new Error(`Guild class function 'load' requires an id:string to execute!`);

        let data = await DB._Get("GuildSettings", { id });

        if (data[0]) {
            delete this.initializing;
            for (const [key, value] in data[0]) {
                this[key] = value;
            };
        };

        return this;
    };

    async save(){
        return await DB._Edit("GuildSettings", {id:this.id}, this);
    };
};

module.exports = {
    /**
     * @param {import('discord.js').Guild} guild
     */
    getSettings: async (guild) => {
        if (!guild) throw new Error("Guild is undefined");
        if (!guild.id) throw new Error("Guild Id is undefined");

        //const cached = cache.get(guild.id);
        //if (cached) return cached;

        let guildDB = new _Guild();
        await guildDB.load(guild.id)
        if (guildDB.initializing) {
            // save owner details
            try{
                let user = await guild.members.fetch(guild.ownerID);
                await getUser(user);
            }catch(err){
                console.error(`Guild.getSettings().getUser(owner) Error gettingUser`, err);
            };

            // create a new guild model
            guildDB.create({
                id: guild.id
            });

        };
        //cache.add(guild.id, guildData);
        return guildDB;
    },
};
