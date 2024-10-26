//const { automodHandler, statsHandler } = require("@src/handlers");
const { commandHandler } = require('../../../Handlers');
const config = require("../../../../config");
const Guild = require("../../../../Database/Schemas/Guild");
const DiscordPlayer = require('../../../../Database/Schemas/Player/DiscordPlayer');
const { MessageEmbed } = require('discord.js');

const cooldowns = {};

/**
 * @param {import('../../../Structures').BotClient} client
 * @param {import('discord.js').Message} message
 */
module.exports = async (client, message) => {
    if (message.author.bot) return;
    if (!message.guild) return;

    if(!message.guild.settings){
        let guildSettings = await new Guild(message.guild, client);
        /** @type {Guild} */
        message.guild.settings = guildSettings;
    };

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

    let prefixes = [config.DEFAULT_PREFIX, message.guild.settings.prefix];

    let prefix;
    for(let x = 0; x < prefixes.length; x++){
        if(message.content.toLowerCase().startsWith(prefixes[x])){
            prefix = prefixes[x];
            break;
        };
    };

    if (message.content && prefix) {
        const invoke = message.content.replace(`${prefix}`, "").split(/\s+/)[0];
        message.prefix = prefix;
        const cmd = client.getCommand(invoke);

        if (cmd) {
            isCommand = true;
            commandHandler.handlePrefixCommand(message, cmd, message.guild.settings);
        };
    } else if (client.riftChannels.codeGiveAways.includes(message.channel.id) && !message.content.startsWith('..')) {
        if ((Date.now() < cooldowns[message.author.id])) return message.reply(`You're currently on cooldown for another ${(cooldowns[message.author.id]-Date.now()) /1000} seconds.\n>  *This is done to prevent spamming multiple servers! Abuse of this feature may get you banned from it's use!*`).then(m => { m.delete({timeout: 15000}) });

        try{
            /** @type {import('../../../../Database/Schemas/Player/Player')} */
            let player = client.Players[await client.PlayersIndex.get(message.author.id)];
            let playerClan;
            if (player && player?.clan.id) playerClan = await player.getClan();
            /** @type {import('../../../../Database/Schemas/Clan/_Clan')} */
            let clan = client.Clans[await client.ClansIndex.get(message.guild.id)];

            let embed = new MessageEmbed()
                .setColor("RANDOM")
                .setTimestamp()
                .setFooter(`${client.user.username} by [G-C-A] ShadowSpyy`)
            if (clan && clan?.discord && clan.discord?.invite) embed.setDescription(`> [Server Invite](https://discord.gg/${clan.discord.invite})\n\n${message.content}\n`);
            else embed.setDescription(`\n${message.content}\n`);

            if (player) embed.setAuthor(`${player.clan ? `[${playerClan.tag}] ${client.Ranks[client.RanksIndex.get(player.clan.rank)].short} ` : ''}${player.name}`);
            else embed.setAuthor(message.author.username, message.author.displayAvatarURL({dynamic:true}));

            if (clan) embed.setTitle(`[${clan.tag}] ${clan.name}]`);
            else embed.setTitle(`[Unaligned] (${message.guild.nameAcronym}) ${message.guild.name}`);

            for (let x = 0; x < client.riftChannels.codeGiveAways.length; x++){
                if (message.channel.id === client.riftChannels.codeGiveAways[x]) continue;
                let ch = client.channels.cache.get(client.riftChannels.codeGiveAways[x]);
                if (!ch){
                    client.riftChannels.codeGiveAways = client.riftChannels.codeGiveAways.splice(x, 1);
                    continue;
                };

                ch.send(embed);
            };
            cooldowns[message.author.id] = Date.now() + 15000;
            message.react('✅');
        } catch (err){
            message.react('❌');
            return message.reply(`There was an error sending to the other ${client.riftChannels.codeGiveAways.length} code giveaway channels!\n  <@${config.OWNER_IDS[0]}>,\n\`\`\`js\n${err.stack}\n\`\`\``, {split:1});
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
