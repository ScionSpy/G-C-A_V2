const { MessageEmbed } = require("discord.js");
const { EMBED_COLORS } = require("../../../config");

/**
 * @type {import("../../Structures/Command")}
 */
module.exports = {
    name: "userinfo",
    enabled: true,
    aliases: ["uinfo", "memberinfo"],
    description: "shows information about the user",
    usage: "[@member|id]",
    category: "INFORMATION",
    botPermissions: ["EMBED_LINKS"],

    async exe(message, args) {
        const target = (await message.guild.resolveMember(args[0])) || message.member;
        const response = userInfo(target);
        await message.channel.send(response);
    },
};



/**
 * @param {import('discord.js').GuildMember} member
 */
function userInfo(member){
    let color = member.displayHexColor;
    if (color === "#000000") color = EMBED_COLORS.BOT_EMBED;

    let rolesString = member.roles.cache.map((r) => r.name).join(", ");
    if (rolesString.length > 1024) rolesString = rolesString.substring(0, 1020) + "...";

    const embed = new MessageEmbed()
        .setAuthor(`User information for ${member.displayName}`, member.user.displayAvatarURL({ dynamic: true, format: 'webp' }))
        .setThumbnail(member.user.displayAvatarURL())
        .setColor(color)
        .addFields(
            {
                name: "Username",
                value: member.user.username,
                inline: true,
            },
            {
                name: "ID",
                value: member.id,
                inline: true,
            },
            {
                name: "Guild Joined",
                value: member.joinedAt.toUTCString(),
            },
            {
                name: "Discord Registered",
                value: member.user.createdAt.toUTCString(),
            },
            {
                name: `Roles [${member.roles.cache.size}]`,
                value: rolesString,
            },
            {
                name: "Avatar-URL",
                value: member.user.displayAvatarURL({ dynamic: true, format: 'webp'}),
            }
        )
        .setFooter(`Requested by ${member.user.tag}`)
        .setTimestamp(Date.now());

    return embed;
};
