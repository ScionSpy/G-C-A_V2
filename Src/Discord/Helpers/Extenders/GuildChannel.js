const { GuildChannel, ChannelType } = require("discord.js");

/**
 * Check if bot has permission to send embeds
 */
GuildChannel.prototype.canSendEmbeds = function () {
    return this.permissionsFor(this.guild.members.me).has(["VIEW_CHANNEL", "SEND_MESSAGES", "EmbEMBED_LINKSedLinks"]);
};

/**
 * Safely send a message to the channel
 * @param {string|import('discord.js').MessagePayload|import('discord.js').MessageOptions} content
 * @param {number} [seconds]
 */
GuildChannel.prototype.safeSend = async function (content, extras = {}) {
    if (!content) return;
    if (!this.type === ChannelType.GuildText && !this.type === ChannelType.DM) return;

    const perms = ["VIEW_CHANNEL", "SEND_MESSAGES"];
    if (content.embeds && content.embeds.length > 0) perms.push("EMBED_LINKS");
    if (!this.permissionsFor(this.guild.members.me).has(perms)) return;

    try {
        if (!extras.seconds) return await this.send(content, extras);
        let seconds = extras.seconds;
        delete extras.seconds
        const reply = await this.send(content, extras);
        setTimeout(() => reply.deletable && reply.delete().catch((ex) => { }), seconds * 1000);
    } catch (ex) {
        this.client.logger.error(`safeSend`, ex);
    }
};
