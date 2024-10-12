const {
    Client,
    Collection,
    MessageEmbed
} = require("discord.js");
const path = require("path");
const { recursiveReadDirSync } = require("../Helpers/Utils.js");
const Clan = require("../../Database/Schemas/index.js").Clans.Clan;
const { Player, DiscordPlayer } = require('../../Database/Schemas/index.js').Players;
const { getTimeStamp } = require('../Helpers/Utils.js');

const { PlayerManager } = require('../Helpers/Managers/index.js');



/**
 * Description placeholder
 *
 * @class BotClient
 * @typedef {BotClient}
 * @extends {Client}
 */
class BotClient extends Client {


    constructor(){
        super({
            disableMentions: 'everyone',
            presence: {
                status: 'dnd',
                activity: {
                    type:"PLAYING",
                    name:"with my files."
                }
            }
        });

        this.config = require('../../config.js');

        this.commands = [];
        this.commandIndex = new Collection();

        // Logger
        // this.logger = Logger;

        // Database
        this.DB = require('../../Database/index.js');
        this.API = {
            WoWs: require('../../WebAPI/Wargaming/index.js')
        };

        this.supportServer;

        this.Ranks = [];
        this.RanksIndex = new Collection();

        /** @type {Clan} clan*/
        this.Clan;

        this.Clans = [];
        this.ClansIndex = new Collection();

        /**
         * Array of Player profiles within game.
         * @type {Array<Player> | Array<DiscordPlayer}
         */
        this.Players = [];

        /**
         * Collection of Player Array Indexes within the {Players} array.
         *
         * @type {Collection}
         * @example
         * let index = PlayersIndex.get("ShadowSpyy"); // -> int
         * let player = Players[index]; // -> { Player | DiscordPlayer }
         */
        this.PlayersIndex = new Collection();


        this.riftChannels = {
            codeGiveAways: [],
            mercs: [],
            rift: [],
        };
    };

    /**
     * Load all events from the specified directory
     * @param {string} directory directory containing the event files
     */
    loadEvents(directory) {
        console.log(`> Loading events...`);
        let success = 0;
        let failed = 0;
        const clientEvents = [];

        recursiveReadDirSync(directory).forEach((filePath) => {
            const file = path.basename(filePath);
            try {
                const eventName = path.basename(file, ".js");
                const event = require(filePath);

                this.on(eventName, event.bind(null, this));
                //clientEvents.push(`✓ ${file}`);
                clientEvents.push(["✓", file]);

                delete require.cache[require.resolve(filePath)];
                success += 1;
            } catch (ex) {
                failed += 1;
                console.error(`loadEvent - ${file}`, ex);
            };
        });

        let events = prettyArrays(clientEvents, 2);
        console.log(events);

        console.log(`>> Loaded ${success + failed} events. Success (${success}) Failed (${failed})\n`);
    };

    /**
     * Load all events from the specified directory
     * @param {string} directory directory containing the event files
     */
    loadGCAEvents(directory) {
        console.log(`> Loading GCA events...`);
        let success = 0;
        let failed = 0;
        const clientEvents = [];

        recursiveReadDirSync(directory).forEach((filePath) => {
            const file = path.basename(filePath);
            try {
                const eventName = path.basename(file, ".js");
                const event = require(filePath);

                this.on(eventName, event.bind(null, this));
                //clientEvents.push(`✓ ${file}`);
                clientEvents.push(["✓", file]);

                delete require.cache[require.resolve(filePath)];
                success += 1;
            } catch (ex) {
                failed += 1;
                console.error(`loadEvent - ${file}`, ex);
            };
        });

        let events = prettyArrays(clientEvents, 2);
        console.log(events);

        console.log(`>> Loaded ${success + failed} GCA events. Success (${success}) Failed (${failed})\n`);
    };

    /**
     * Find command matching the invoke
     * @param {string} invoke
     * @returns {import('@structures/Command')|undefined}
     */
    getCommand(invoke) {
        const index = this.commandIndex.get(invoke.toLowerCase());
        return index !== undefined ? this.commands[index] : undefined;
    };

    /**
     * Register command file in the client
     * @param {import("@structures/Command")} cmd
     */
    loadCommand(cmd) {
        const index = this.commands.length;
        if (this.commandIndex.has(cmd.name)) {
            throw new Error(`Command ${cmd.name} already registered`);
        };

        if (Array.isArray(cmd.aliases)) {
            cmd.aliases.forEach((alias) => {
                if (this.commandIndex.has(alias)) throw new Error(`Alias ${alias} already registered`);
                this.commandIndex.set(alias.toLowerCase(), index);
            });
        };

        this.commandIndex.set(cmd.name.toLowerCase(), index);
        this.commands.push(cmd);
    };


    /**
     * Load all commands from the specified directory
     * @param {string} directory
     */
    loadCommands(directory) {
        console.log(`> Loading commands...`);
        let success = 0;
        let failed = 0;
        const clientCommands = [];

        const files = recursiveReadDirSync(directory);
        for (const file of files) {
            try {
                const cmd = require(file);
                if (typeof cmd !== "object") continue;
                this.loadCommand(cmd);

                clientCommands.push(`✓ ${cmd.name}`);
                success += 1;
            } catch (ex) {
                failed += 1;
                console.error(`⚠⚠⚠⚠⚠⚠⚠⚠⚠\n\nFailed to load ${file} Reason: ${ex.message}\n\n⚠⚠⚠⚠⚠⚠⚠⚠⚠`);
            };
        };

        let cmds = prettyArrays(clientCommands, 5);
        console.log(cmds);

        console.log(`>> Loaded ${success + failed} commands. Success (${success}) Failed (${failed})\n`);
    };



    async #getCh(chID){
        try {
            let ch = this.supportServer.channels.cache.get(chID);
            return ch;
        } catch(err){
            throw new Error(`BotClient.#getCh(chID = ${chID}); Error fetching channel from cache!\n\n${err.stack}`);
        };
    };


    /**
     * Bot joined a server.
     * @param {import('discord.js').Guild} guild
     */
    async _postNewGuild(guild){
        let ch = await this.#getCh('1293009453347635300');
        let owner = await this.users.fetch(guild.ownerID);

        let embed = new MessageEmbed()
            .setColor("GREEN")
            .setTitle("Server Joined")
            .setAuthor(guild.name, guild.iconURL({dynamic:true}))
            .setDescription(`\`\`\`js\n  Owner : ${owner.username} (${guild.ownerID})\nMembers : ${guild.memberCount}\nCreated : ${getTimeStamp(guild.createdTimestamp)}\`\`\``)
            .setFooter(this.user.username, this.user.avatarURL({dynamic:true}))
            .setTimestamp()

        return await ch.send(embed);
    };


    /**
     * Bot left a server.
     * @param {import('discord.js').Guild} guild
     */
    async _postOldGuild(guild) {
        let ch = await this.#getCh('1293009453347635300');
        let owner = await this.users.fetch(guild.ownerID);

        let embed = new MessageEmbed()
            .setColor("RED")
            .setTitle("Server Left")
            .setAuthor(guild.name)
            .setDescription(`\`\`\`js\n Owner : ${owner.username} (${guild.ownerID})\nJoined : ${getTimeStamp(guild.joinedTimestamp)} \`\`\``)
            .setFooter(this.user.username, this.user.avatarURL({ dynamic: true }))
            .setTimestamp()

        return await ch.send(embed);
    };
};


/**
 * Description placeholder
 *
 * @param {Array} array
 * @param {number} itemsPerLine MAX = 5
 * @returns {Array<{count:Number, place:Number}>}
 */
function prettyArrays(array, itemsPerLine){
    let newArray = [];
    let POS = {
        count: 0,
        place: 0
    };

    for (let x = 0; x < array.length; x++) {
        let cmd = array[x];

        if (!newArray[POS.place]) newArray[POS.place] = [];
        newArray[POS.place].push(cmd);

        POS.count++;
        if (POS.count == itemsPerLine) {
            POS.count = 0;
            POS.place++;
        };
    };

    return newArray;
};

module.exports = BotClient;
