const { MessageEmbed } = require('discord.js');

/**
 * @type {import("../../Structures/Command")}
 */
const cmd = {};
module.exports = cmd;
cmd.enabled = true;
cmd.name = "settings";
cmd.category = "admin";
cmd.description = "Allows the modification of server based settings.";
cmd.userPermissions = ["ADMINISTRATOR", "MANAGE_GUILD", "MANAGE_CHANNELS"];
cmd.subcommands = [];

let embed;

cmd.exe = async function(message, args){

    embed = new MessageEmbed();
    embed.setTimestamp();
    embed.setFooter(`${message.client.user.username} by [G-C-A] ShadowSpyy`, message.client.user.avatarURL({ dynamic: true }));

    let isAdmin = false;
    let guild = message.guild;
    if (args.length >= 2 && args[0] == '*' && message.client.config.OWNER_IDS.includes(message.author.id) && !isNaN(args[1])){
        isAdmin = true; args.shift(); // delete the '*';
        let guildID = args.shift();
        guild = message.client.guilds.cache.get(guildID);
        if (!guild) return message.reply(`There is no cached guild with an ID of \`${guildID}\``);
    };

    let settings = await message.client.DB._Get("GuildSettings", { id: guild.id });
    settings = settings[0];

    if (args.length == 0) {
        if (!isAdmin) {
            embed.setTitle(`Server Settings`);
            embed.setAuthor(`${guild.name} \n» Owner: ${guild.owner.displayName} `, guild.iconURL({ dynamic: true }));
        } else {
            embed.setTitle(`==== DEVELOPER ====\nServer Settings`);
            embed.setAuthor(`${guild.name} (${guild.id})\n» ${guild.owner.displayName} (${guild.ownerID})`, guild.iconURL({ dynamic: true }));
        };

        if (settings.clan_id) settings.clan_id = `${message.client.Clans[message.client.ClansIndex.get(settings.clan_id.toString())].tag} (${settings.clan_id})`;

        await getSettingsEmbed(settings, guild);

        embed.setDescription(`To edit run \`${message.prefix}${cmd.name} {key} {value}\` omitting spaces.\nie: ${message.prefix}${cmd.name} memberupdates ${guild.channels.cache.first()}`);

        return message.channel.send(embed);
    };

    if (args.length < 2) return message.reply(`Additional use of this command requires at least 2 arguments. \`{key:value}\``);
    let subCmd = args.shift().toLowerCase();

    if (subCmd === 'prefix'){
        try {
            let newPrefix = args.shift().toLowerCase();
            if (newPrefix == 'clear' || newPrefix == 'reset' ||newPrefix == 'null') newPrefix = message.client.config.DEFAULT_PREFIX;

            await message.client.DB._Edit("GuildSettings", {id:guild.id}, {prefix:newPrefix});

            message.reply(`Server prefix updated! \`\`\`js\nOld Prefix : ${settings.prefix}\nNew Prefix : ${newPrefix}\`\`\``);
        } catch(err){ message.error(`Error updating prefix!`, err)};
    };

    if(
        subCmd === 'welcome' ||
        subCmd === 'farewell' ||
        subCmd === 'voice' ||
        subCmd === 'codegiveaways' ||
        subCmd === 'memberupdates' ||
        subCmd === 'adminupdates' ||
        subCmd === 'nameupdates' ||
        subCmd === 'inactivity' ||
        subCmd === 'directmessages'
    ) {
        let resolved = await guild.resolveChannel(args[0]);
        if (!resolved) return message.reply(`You must provide a valid Channel mention, ID or name for the setting to work!`);
        switch(subCmd){
            case ('voice'): subCmd = 'voiceStats'; break;
            case ('codegiveaways'): subCmd = 'codeGiveAways'; break;
            case ('memberupdates'): subCmd = 'memberUpdates'; break;
            case ('adminupdates'): subCmd = 'memberUpdates_admin'; break;
            case ('nameupdates'): subCmd = 'nameUpdates'; break;
            case ('directmessages'): case('dm'): subCmd = 'DMs'; break;
        };

        let oldCh = guild.channels.cache.get(settings.discord.channels[subCmd]);

        let data = settings.discord.channels;
        data[subCmd] = resolved.id;

        await message.client.DB._Edit("GuildSettings", { id: guild.id }, {'discord.channels': data});

        message.reply(`Server Channel updated! \`\`\`js\nOld ${subCmd} Channel : ${oldCh ? oldCh.name: 'Not-Set'}\nNew ${subCmd} Channel : ${resolved.name}\`\`\``);

    };
};



/**
 *
 * @param {*} settings
 * @param {import('discord.js').Guild} guild
 */
async function getSettingsEmbed(settings, guild) {

    async function getCh(id){
        let ch = guild.channels.cache.get(id);
        if (!ch) return 'Unknown Channel';
        else return '#'+ch.name;
    };

    let General = [
        `Prefix : ${settings.prefix}`,
        `  Clan : ${settings.clan_id}`
    ];
    embed.addField("General", `\`\`\`js\n${General.join('\n')}\`\`\``);

    let GuildChannels = [
        ` Welcome : ${settings?.discord?.channels?.welcome ? await getCh(settings?.discord?.channels?.welcome) : 'Not-Set'}`,
        `Farewell : ${settings?.discord?.channels?.farewell ? await getCh(settings?.discord?.channels?.farewell) : 'Not-Set'}`,
        `   Voice : ${settings?.discord?.channels?.voiceStats ? await getCh(settings?.discord?.channels?.voiceStats) : 'Not-Set'}`,
        `GiveAway : ${settings?.discord?.channels?.codeGiveAways ? await getCh(settings?.discord?.channels?.codeGiveAways) : 'Not-Set'}`,
    ];
    embed.addField("Guild Channels", `\`\`\`js\n${GuildChannels.join('\n')}\`\`\``, true);

    let ClanChannels = [
        ` Member Updates : ${settings?.discord?.channels?.memberUpdates ? await getCh(settings?.discord?.channels?.memberUpdates) : 'Not-Set'}`,
        `  Admin Updates : ${settings?.discord?.channels?.memberUpdates_admin ? await getCh(settings?.discord?.channels?.memberUpdates_admin) : 'Not-Set'}`,
        `   Name Updates : ${settings?.discord?.channels?.nameUpdates ? await getCh(settings?.discord?.channels?.nameUpdates) : 'Not-Set'}`,
        `     Inactivity : ${settings?.discord?.channels?.inactivity ? await getCh(settings?.discord?.channels?.inactivity) : 'Not-Set'}`,
        `Direct Messages : ${settings?.discord?.channels?.DMs ? await getCh(settings?.discord?.channels?.DMs) : 'Not-Set'}`,
    ];
    embed.addField("Clan Channels", `\`\`\`js\n${ClanChannels.join('\n')}\`\`\``, true);
};

/*
🎨 Picture Artist: AOI
» PIXIV ID: 92677883
» PICTURE ID: 120377868
*/
