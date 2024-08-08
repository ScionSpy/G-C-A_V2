const { MessageEmbed } = require("discord.js");
const { EMBED_COLORS } = require("../../../../config");

/**
 * @type {import("../../../Structures/Command")}
 */
module.exports = {
    name: "avatar",
    enabled: true,
    description: "shows a users avatar information",
    usage: "[@member|id]",
    category: "INFORMATION",
    botPermissions: ["EMBED_LINKS"],

    async exe(message, args) {
        const target = (await message.guild.resolveMember(args[0])) || message.member;
        const response = avatarInfo(target.user);
        await message.channel.send(response);
    },
};


/**
 * @param {import('discord.js').User} user
 */
module.exports = (user) => {
    const x64 = user.displayAvatarURL({ extension: "png", size: 64 });
    const x128 = user.displayAvatarURL({ extension: "png", size: 128 });
    const x256 = user.displayAvatarURL({ extension: "png", size: 256 });
    const x512 = user.displayAvatarURL({ extension: "png", size: 512 });
    const x1024 = user.displayAvatarURL({ extension: "png", size: 1024 });
    const x2048 = user.displayAvatarURL({ extension: "png", size: 2048 });

    const embed = new MessageEmbed()
        .setTitle(`Avatar of ${user.username}`)
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setImage(x256)
        .setDescription(
            `Links: • [x64](${x64}) ` +
            `• [x128](${x128}) ` +
            `• [x256](${x256}) ` +
            `• [x512](${x512}) ` +
            `• [x1024](${x1024}) ` +
            `• [x2048](${x2048}) `
        );

    return embed
};
