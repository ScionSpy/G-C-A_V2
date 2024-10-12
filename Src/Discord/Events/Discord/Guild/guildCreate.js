const { DEFAULT_PREFIX } = require('../../../../config');
const Guild = require('../../../../Database/Schemas/Guild');

/**
 *
 * @param {import('../../../Structures/BotClient')} bot
 * @param {import('discord.js').Guild} guild
 */
module.exports = async function(bot, guild){
    console.log(`==== NEW GUILD ====\n> Name : ${guild.name}\n> ID : ${guild.id}`);

    let dbGuild = bot.DB._Get("GuildSettings", { id:guild.id });
    if(!dbGuild[0]) dbGuild = guild;

    let guildSettings = await new Guild(dbGuild, bot);
    guildSettings = await guildSettings.toggleClan(true);
    guild.settings = guildSettings;

    await bot._postNewGuild(guild);
};
