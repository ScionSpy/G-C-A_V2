const { EmbedBuilder, ApplicationCommandOptionType, MessageEmbed } = require("discord.js");
const { EMBED_COLORS } = require("../../../config");

// This dummy token will be replaced by the actual token
const DUMMY_TOKEN = "SHADOW_TOKEN";

/**
 * @type {import("../../Structures/Command")}
 */
module.exports = {
    name: "eval",
    aliases: ["evald"],
    description: "evaluates something",
    category: "OWNER",
    enabled: true,
    usage: "<script>",
    args: 1,

    async exe(message, args) {
        const input = args.join(" ");

        if (!input) return message.channel.send("Please provide the code I'm evaluating...");

        let response;
        try {
            //Define Eval phrases.
            const bot = message.client;
            const e = new MessageEmbed();

            let output = eval(input);
            response = await buildSuccessResponse(output, message.client);
        } catch (ex) {
            response = buildErrorResponse(ex);
        };

        if (typeof response === "string") await message.channel.send(response, { code: 'js', split: true });
        else await message.channel.send(response);
    }
};

const buildSuccessResponse = async (output, client) => {

    if (output && output.constructor.name == "Promise") output = await output;


    // Token protection
    output = require("util").inspect(output, { depth: 1 }).replaceAll(client.token, DUMMY_TOKEN);

    /*const embed = new MessageEmbed()
        .setAuthor({ name: "📤 Output" })
        .setDescription("```js\n" + (output.length > 4096 ? `${output.substr(0, 4000)}...` : output) + "\n```")
        .setColor("Random")
        .setTimestamp(Date.now());

    return embed;*/

    return output;
};

const buildErrorResponse = (err) => {
    /*const embed = new MessageEmbed();
    embed
        .setAuthor({ name: "📤 Error" })
        .setDescription("```js\n" + (err.length > 4096 ? `${err.substr(0, 4000)}...` : err) + "\n```")
        .setColor(EMBED_COLORS.ERROR)
        .setTimestamp(Date.now());

    return embed;*/
    if(!err.stack && typeof err !== "string") return JSON.stringify(err, null, 4);
    else if (!err.stack) return err;
    else return err.stack;
};
