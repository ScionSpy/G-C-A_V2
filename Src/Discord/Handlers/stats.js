const { getMemberStats } = require('../../Database/Schemas/MemberStats');
const { getRandomInt } = require('../Helpers/Utils');

//const cooldownCache = new Map();
const voiceStates = new Map();

/**
 * @param {string} content
 * @param {import('discord.js').GuildMember} member
 * @param {number} level
 */
const parse = (content, member, level) => {
    return content
        .replaceAll(/\\n/g, "\n")
        .replaceAll(/{server}/g, member.guild.name)
        .replaceAll(/{count}/g, member.guild.memberCount)
        .replaceAll(/{member:id}/g, member.id)
        .replaceAll(/{member:name}/g, member.displayName)
        .replaceAll(/{member:mention}/g, member.toString())
        .replaceAll(/{member:tag}/g, member.user.tag)
        .replaceAll(/{level}/g, level);
};

module.exports = {
    /**
       * @param {import('discord.js').VoiceState} oldState
       * @param {import('discord.js').VoiceState} newState
       */
    async trackVoiceStats(oldState, newState) {
        const oldChannel = oldState.channel;
        const newChannel = newState.channel;
        const now = Date.now();

        if (!oldChannel && !newChannel) return;
        if (!newState.member) return;

        const member = await newState.member.fetch().catch(() => { });
        if (!member || member.user.bot) return;


        // Member joined a voice channel
        if (!oldChannel && newChannel) {
            const statsDb = await getMemberStats(member.guild.id, member.id);

            statsDb.voice.connections += 1;
            await statsDb.save();
            voiceStates.set(member.id, now);
        };

        // Member left a voice channel
        if (oldChannel && !newChannel) {
            const statsDb = await getMemberStats(member.guild.id, member.id);

            let time;
            if (voiceStates.has(member.id)) {
                time = now - voiceStates.get(member.id);
                voiceStates.delete(member.id);
                
            }else{
                time = now - oldState.client.readyTimestamp;
            };

            statsDb.voice.time += time / 1000; // add time in seconds
            await statsDb.save();
        };
    }
};
