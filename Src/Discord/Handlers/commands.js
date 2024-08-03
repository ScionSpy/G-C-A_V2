const { MessageEmbed } = require("discord.js");
const { OWNER_IDS, DEFAULT_PREFIX, EMBED_COLORS } = require("../../config");
const { parsePermissions } = require("../Helpers/Utils");
//const { timeformat } = require("@helpers/Utils");

const cooldownCache = new Map();

module.exports = {
    /**
     * @param {import('discord.js').Message} message
     * @param {import("../Structures/Command")} cmd
     */
    handlePrefixCommand: async function (message, cmd) {
        const prefix = DEFAULT_PREFIX;
        const args = message.content.replace(prefix, "").split(/\s+/);
        const invoke = args.shift().toLowerCase();

        const data = {};
        data.prefix = prefix;
        data.invoke = invoke;

        if (!message.channel.permissionsFor(message.guild.me).has("SEND_MESSAGES")) return;

        // callback validations
        if (cmd.validations) {
            for (const validation of cmd.validations) {
                if (!validation.callback(message)) {
                    return message.channel.send(validation.message);
                };
            };
        };

        // Owner commands
        if (cmd.category === "OWNER" && !OWNER_IDS.includes(message.author.id)) { console.log('cmd.isOwner');
            return message.channel.send("This command is only accessible to bot owners");
        };

        // check user permissions
        if (cmd.userPermissions && cmd.userPermissions?.length > 0) {
            if (!message.channel.permissionsFor(message.member).has(cmd.userPermissions)) {
                return message.channel.send(`You need ${parsePermissions(cmd.userPermissions)} for this command`);
            };
        };

        // check bot permissions
        if (cmd.botPermissions && cmd.botPermissions.length > 0) {
            if (!message.channel.permissionsFor(message.guild.me).has(cmd.botPermissions)) {
                return message.channel.send(`I need ${parsePermissions(cmd.botPermissions)} for this command`);
            };
        };

        // minArgs count
        if (cmd.args > args.length) {
            const usageEmbed = this.getCommandUsage(cmd, prefix, invoke);
            return message.channel.send(usageEmbed);
        };

        // cooldown check
        if (cmd.cooldown > 0) {
            const remaining = getRemainingCooldown(message.author.id, cmd);
            if (remaining > 0) {
                return message.channel.send(`You are on cooldown. You can again use the command in \`${timeformat(remaining)}\``);
            };
        };

        try {
            await cmd.exe(message, args, data);
        } catch (err) {
            /*if (message.channel.permissionsFor(message.guild.me).has("EMBED_LINKS") && (err.length < 4096)) {
                let embed = new MessageEmbed()
                    .setAuthor("Command Error : " + cmd.name)
                    .setDescription("```js\n" + (err.length > 4096 ? `${err.substr(0, 4000)}...` : err) + "\n```")
                    .setColor(EMBED_COLORS.ERROR)
                    .setTimestamp(Date.now());

                message.channel.send(embed);
            };*/
            message.channel.send(err.stack, {code:'js', split:true});
        } finally {
            if (cmd.cooldown > 0) applyCooldown(message.author.id, cmd);
        };
    },

    /**
     * Build a usage embed for this command
     * @param {import('../Structures/Command')} cmd - command object
     * @param {string} prefix - guild bot prefix
     * @param {string} invoke - alias that was used to trigger this command
     * @param {string} [title] - the embed title
     */
    getCommandUsage(cmd, prefix = DEFAULT_PREFIX, invoke, title = "Usage") {
        let desc = "";
        if (cmd.subcommands && cmd.subcommands.length > 0) {
            cmd.subcommands.forEach((sub) => {
                desc += `\`${prefix}${invoke || cmd.name} ${sub.trigger}\`\n❯ ${sub.description}\n\n`;
            });
            if (cmd.cooldown) {
                desc += `**Cooldown:** ${timeformat(cmd.cooldown)}`;
            };
        } else {
            desc += `\`\`\`css\n${prefix}${invoke || cmd.name} ${cmd.usage}\`\`\``;
            if (cmd.description !== "") desc += `\n**Help:** ${cmd.description}`;
            if (cmd.cooldown) desc += `\n**Cooldown:** ${timeformat(cmd.cooldown)}`;
        };

        const embed = new MessageEmbed().setColor(EMBED_COLORS.BOT_EMBED).setDescription(desc);
        if (title) embed.setAuthor({ name: title });
        return embed;
    },
};

/**
 * @param {string} memberId
 * @param {object} cmd
 */
function applyCooldown(memberId, cmd) {
    const key = cmd.name + "|" + memberId;
    cooldownCache.set(key, Date.now());
};

/**
 * @param {string} memberId
 * @param {object} cmd
 */
function getRemainingCooldown(memberId, cmd) {
    const key = cmd.name + "|" + memberId;
    if (cooldownCache.has(key)) {
        const remaining = (Date.now() - cooldownCache.get(key)) * 0.001;
        if (remaining > cmd.cooldown) {
            cooldownCache.delete(key);
            return 0;
        };
        return cmd.cooldown - remaining;
    };
    return 0;
};
