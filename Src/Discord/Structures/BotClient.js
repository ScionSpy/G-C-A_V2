const {
    Client,
    Collection
} = require("discord.js");
const path = require("path");
const { recursiveReadDirSync } = require("../Helpers/Utils");


module.exports = class BotClient extends Client {
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
};


/**
 *
 * @param {Array} array
 * @param {Number} itemsPerLine MAX 5
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
