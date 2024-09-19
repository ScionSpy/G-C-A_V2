//const { automodHandler, statsHandler } = require("@src/handlers");
const { commandHandler } = require('../../../Handlers');
const config = require("../../../../config");
const { getSettings } = require("../../../../Database/Schemas/Guild");
const DiscordPlayer = require('../../../../Database/Schemas/Player/DiscordPlayer');

/**
 * @param {import('../../../Structures').BotClient} client
 * @param {import('discord.js').Message} message
 */
module.exports = async (client, message) => {
    if (message.author.bot) return;
    if (message.guild && message.guild.id !== config.SUPPORT_SERVER) return;

    const settings = await getSettings(message.guild);

    if(message.author.player === undefined){
        let index = client.PlayersIndex.get(message.author.id);
        if(index) message.author.player = client.Players[index];
        else{
            let player = new DiscordPlayer({discord_id: message.author.id}, client);
            await player.loadDiscord();
            if(player.name) message.author.player = player;
            else message.author.player = null;
        };
    };

    // command handler
    let isCommand = false;
    // check for bot mentions
    if (message.content.includes(`${client.user.id}`) && message.content.includes(`prefix`)) {
        message.channel.reply(`> My prefix is \`${config.DEFAULT_PREFIX}\``);
    };

    //await awaitReadyState(message);

    if (message.content && message.content.startsWith(settings.prefix)) {
        const invoke = message.content.replace(`${settings.prefix}`, "").split(/\s+/)[0];
        const cmd = client.getCommand(invoke);

        if (cmd) {
            isCommand = true;
            commandHandler.handlePrefixCommand(message, cmd, settings);
        };
    };

    // stats handler
    //await statsHandler.trackMessageStats(message, isCommand, settings);

    // if not a command
    //if (!isCommand) await automodHandler.performAutomod(message, settings);
};


async function awaitReadyState(message) {
    // parms = {Cmd: Object, Args: Array[String]}
    let ready = new Promise(async function (res, rej) {
        if (!message.client.gcaReadyAt) {
            if (parms?.Cmd) message.reply(`G-C-A Client booting, request will be processed shortly.`).then(async (msg) => {
                await message.client.once('GCA_Ready', () => {
                    message.reply(`Apologies for the ${Math.ceil((Date.now() - msg.createdTimestamp) / 1000)} second delay!\n    Your request is now being processed!`);
                    res();
                });
            });
        } else res();
    });
    return ready;
};
