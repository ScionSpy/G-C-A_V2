//const { commandHandler, automodHandler, statsHandler } = require("@src/handlers");
const { commandHandler } = require('../../Handlers');
const config = require("../../../config");

/**
 * @param {import('../../Structures').BotClient} client
 * @param {import('discord.js').Message} message
 */
module.exports = async (client, message) => {
    if (message.author.bot) return;
    if (message.guild && message.guild.id !== config.SUPPORT_SERVER) return;

    // command handler
    let isCommand = false;
    // check for bot mentions
    if (message.content.includes(`${client.user.id}`) && message.content.includes(`prefix`)) {
        message.channel.reply(`> My prefix is \`${config.DEFAULT_PREFIX}\``);
    };

    if (message.content && message.content.startsWith(config.DEFAULT_PREFIX)) {
        const invoke = message.content.replace(`${config.DEFAULT_PREFIX}`, "").split(/\s+/)[0];
        const cmd = client.getCommand(invoke);
        if (cmd) {
            isCommand = true;
            commandHandler.handlePrefixCommand(message, cmd);
        };
    };

    // stats handler
    //await statsHandler.trackMessageStats(message, isCommand, settings);

    // if not a command
    //if (!isCommand) await automodHandler.performAutomod(message, settings);
};
