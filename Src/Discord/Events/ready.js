const { presenceHandler } = require("../Handlers");
//const { cacheReactionRoles } = require("@schemas/ReactionRoles");
//const { getSettings } = require("@schemas/Guild");

/**
 * @param {import('../Structures').BotClient} client
 */
module.exports = async (client) => {
    console.log(`Logged in as ${client.user.tag}! (${client.user.id})`);

    // Update Bot Presence
    presenceHandler(client);

    // Load reaction roles to cache
    //await cacheReactionRoles(client);


};
