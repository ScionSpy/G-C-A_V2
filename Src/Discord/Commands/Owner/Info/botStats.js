const { MessageEmbed } = require("discord.js");
const { EMBED_COLORS } = require("../../../../config");
const { timeformat } = require("../../../Helpers/Utils");
const os = require("os");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
    name: "botstats",
    enabled: true,
    aliases: ["botstat", "botinfo"],
    description: "shows information pertaining to the client.",
    category: "INFORMATION",
    botPermissions: ["EMBED_LINKS"],
    cooldown: 5,

    async exe(message, args) {
        const response = botstats(message.client);
        await message.channel.send(response);
    },
};



/**
 * @param {import('../../../Structures/BotClient')} client
 */
botstats = (client) => {
    // STATS
    const channels = client.channels.cache.size;
    const users = client.guilds.cache.reduce((size, g) => size + g.memberCount, 0);

    // CPU
    const platform = process.platform.replace(/win32/g, "Windows");
    const architecture = os.arch();
    const cores = os.cpus().length;
    const cpuUsage = `${(process.cpuUsage().user / 1024 / 1024).toFixed(2)} MB`;

    // RAM
    const botUsed = `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`;
    const botAvailable = `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`;
    const botUsage = `${((process.memoryUsage().heapUsed / os.totalmem()) * 100).toFixed(1)}%`;

    const overallUsed = `${((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2)} GB`;
    const overallAvailable = `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`;
    const overallUsage = `${Math.floor(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)}%`;

    let desc = "";
    desc += `❒ Total users: ${users}\n`;
    desc += `❒ Total channels: ${channels}\n`;
    desc += `❒ Websocket Ping: ${client.ws.ping} ms\n`;
    desc += "\n";

    const embed = new MessageEmbed()
        .setTitle("Bot Information")
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setThumbnail(client.user.avatarURL())
        .setDescription(desc)
        .addFields(
            {
                name: "CPU",
                value: `❯ **OS:** ${platform} [${architecture}]\n❯ **Cores:** ${cores}\n❯ **Usage:** ${cpuUsage}`,
                inline: true,
            },
            {
                name: "Bot's RAM",
                value: `\n❯ **Used:** ${botUsed}\n❯ **Available:** ${botAvailable}\n❯ **Usage:** ${botUsage}`,
                inline: true,
            },
            {
                name: "Overall RAM",
                value: stripIndent`\n❯ **Used:** ${overallUsed}\n❯ **Available:** ${overallAvailable}\n❯ **Usage:** ${overallUsage}\n`,
                inline: true,
            },
            {
                name: "Node Js version",
                value: process.versions.node,
                inline: false,
            },
            {
                name: "Uptime",
                value: "```" + timeformat(process.uptime()) + "```",
                inline: false,
            }
        );

    return embed;
};
