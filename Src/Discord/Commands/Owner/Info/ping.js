/**
 * @type {import("@structures/Command")}
 */
module.exports = {
    name: "ping",
    enabled: true,
    description: "shows the current ping from the bot to the discord servers",
    category: "INFORMATION",

    async exe(message, args) {
        await message.channel.send(`Pinging....`).then(msg => {
            message.channel.send(`  API : \`${Math.floor(message.client.ws.ping)}ms\`\nClient : \`${msg.createdTimestamp - message.createdTimestamp}ms\``);
        });;
    }
};
