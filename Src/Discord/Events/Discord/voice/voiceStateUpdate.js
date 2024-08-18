const { trackVoiceStats } = require("../../../Handlers/stats");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').VoiceState} oldState
 * @param {import('discord.js').VoiceState} newState
 */
module.exports = async (client, oldState, newState) => {
    // Track voice stats
    trackVoiceStats(oldState, newState);
};
