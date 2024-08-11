const { getMemberStats } = require('../../Database/Schemas/MemberStats');
//const { getRandomInt } = require('../Helpers/Utils');
const { ChannelData, ChannelStats } = require('../../Database/Schemas/MemberStats');

//const cooldownCache = new Map();

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
            if(!statsDb.voice.channels[newChannel.id]) statsDb.voice.channels[newChannel.id] = new ChannelData({guild_id:newChannel.guild.id, channel_id: newChannel.id, name: newChannel.name});

            statsDb.voice.lastChannel = newChannel.id;
            statsDb.voice.channels[newChannel.id].stats.unshift(new ChannelStats({ channel_id: newChannel.id, joined: now}));
            await statsDb.save();
        };

        // Member left a voice channel
        if (oldChannel && !newChannel) {
            const statsDb = await getMemberStats(member.guild.id, member.id);
            if (!statsDb.voice.channels[oldChannel.id]) statsDb.voice.channels[oldChannel.id] = new ChannelData({ guild_id: oldChannel.guild.id, channel_id: oldChannel.id, name: oldChannel.name });
            let lastCh = statsDb.voice.channels[statsDb.voice.lastChannel]?.stats[0] || undefined;

            if(lastCh && (lastCh?.channel_id !== oldChannel.id)){ // The channel they just left was not their last known VC... Can't track these stats...
                statsDb.voice.channels[statsDb.voice.lastChannel].stats.splice(0,1);
            };

            let time = now - oldState.client.readyTimestamp;  // add time in seconds

            if(!lastCh || lastCh.left){ // the user joined a channel while the bot was offline... Give them what time we can.
                lastCh = new ChannelStats({
                    channel_id: oldChannel.id,
                    joined: oldState.client.readyTimestamp,
                    left: now,
                    time: time /1000,
                });
                statsDb.voice.channels[oldChannel.id].stats.unshift(lastCh);
            }else{ //This was their last known VC.

                lastCh.left = now;
                lastCh.time = (now - lastCh.joined) /1000;


                time = now - lastCh.joined;
            };

            statsDb.voice.channels[oldChannel.id].stats[0] = lastCh;

            statsDb.voice.time += time / 1000; // add time in seconds
            await statsDb.save();
        };
    }
};
