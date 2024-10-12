const Guild = require('../../../../Database/Schemas/Guild');

/**
 *
 * @param {import('../../../Structures/BotClient')} bot
 * @param {import('discord.js').Guild} guild
 */
module.exports = async function (bot, guild) {
    console.log(`==== OLD GUILD ====\n> Name : ${guild.name}\n> ID : ${guild.id}`);

    let dbGuild = bot.DB._Get("GuildSettings", { id: guild.id });
    if (!dbGuild[0]) dbGuild = guild;

    let guildSettings = await new Guild(dbGuild, bot);
    guildSettings = await guildSettings.toggleClan(false);

    await bot._postOldGuild(guild);
};
