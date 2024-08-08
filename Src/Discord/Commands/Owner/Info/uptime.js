const { timeformat } = require("../../../Helpers/Utils");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
    name: "uptime", enabled: true,
    description: "gives you bot uptime",
    category: "INFORMATION",

    async exe(message, args) {
        await message.channel.send(`My Uptime: \`${timeformat(process.uptime())}\``);
    },
};
