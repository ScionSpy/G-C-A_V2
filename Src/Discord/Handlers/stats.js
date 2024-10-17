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

        const statsDb = await getMemberStats(member.guild.id, member.id);

        // Member joined a voice channel
        if (!oldChannel && newChannel) {
            if(!statsDb.voice.channels[newChannel.id]) statsDb.voice.channels[newChannel.id] = new ChannelData({guild_id:newChannel.guild.id, channel_id: newChannel.id, name: newChannel.name});

            statsDb.voice.lastChannel = newChannel.id;
            statsDb.voice.channels[newChannel.id].stats.unshift(new ChannelStats({joined: now}));


        } else if (oldChannel && !newChannel) { // Member left a voice channel
            if (!statsDb.voice.channels[oldChannel.id]) statsDb.voice.channels[oldChannel.id] = new ChannelData({ guild_id: oldChannel.guild.id, channel_id: oldChannel.id, name: oldChannel.name });
            let lastCh = statsDb.voice.channels[statsDb.voice.lastChannel]?.stats[0] || undefined;

            if (lastCh && (statsDb.voice.lastChannel !== oldChannel.id)){ // The channel they just left was not their last known VC... Can't track these stats...
                console.log('delete')
                statsDb.voice.channels[statsDb.voice.lastChannel].stats.splice(0,1);
            };

            let time = now - oldState.client.readyTimestamp;  // add time in seconds

            if(!lastCh || lastCh.left){ // the user joined a channel while the bot was offline... Give them what time we can.
                lastCh = new ChannelStats({
                    joined: oldState.client.readyTimestamp,
                    left: now,
                    time: Number((time / 1000).toFixed(3)),
                });
                statsDb.voice.channels[oldChannel.id].stats.unshift(lastCh);

            }else{ //This was their last known VC.

                lastCh.left = now;
                lastCh.time = Number(((now - lastCh.joined) / 1000).toFixed(3));


                time = now - lastCh.joined;
            };

            statsDb.voice.channels[oldChannel.id].stats[0] = lastCh;
            statsDb.voice.channels[oldChannel.id].time += Number((time / 1000).toFixed(3));
            statsDb.voice.time += Number((time / 1000).toFixed(3)); // add time in seconds
        } else { // Member Swapped Voice Channels.

            let time = now - oldState.client.readyTimestamp;  // add time in seconds


            //First handle closing their last VC.

            //Verify there's some stats for this channel to prevent future errors.
            if (!statsDb.voice.channels[oldChannel.id]) statsDb.voice.channels[oldChannel.id] = new ChannelData({ guild_id: oldChannel.guild.id, channel_id: oldChannel.id, name: oldChannel.name});
            let lastCh = statsDb.voice.channels[statsDb.voice.lastChannel]?.stats[0] || undefined;

            // The channel they just left was not their last saved channel.
            // Delete the stats on their last known as we have no "end" to go off of.
            if (lastCh && (statsDb.voice.lastChannel !== oldChannel.id)) {
                statsDb.voice.channels[statsDb.voice.lastChannel].stats.splice(0, 1);
            };

            // The user either has no lastCh, or their lastCh was already closed out...
            // Create a new entry on their just left channel, giving them time from the bots start-up.
            // // At least they'll have some of their recorded data.
            if(!lastCh || lastCh.left){
                let saveTime = Number((time / 1000).toFixed(3)); // add time in seconds

                lastCh = new ChannelStats({
                    joined: oldState.client.readyTimestamp,
                    left: now,
                    time: saveTime,
                });

                statsDb.voice.channels[oldChannel.id].stats.unshift(lastCh);
                statsDb.voice.channels[oldChannel.id].time += saveTime;
                statsDb.voice.time += saveTime;

            } else {
                // Otherwise this was their last known channel, and we need to close it out.

                lastCh.left = now;
                lastCh.time = Number(((now - lastCh.joined) / 1000).toFixed(3));

                time = now - lastCh.joined;
                statsDb.voice.channels[oldChannel.id].stats[0] = lastCh;
                statsDb.voice.channels[oldChannel.id].time += Number((time / 1000).toFixed(3));
                statsDb.voice.time += Number((time /1000).toFixed(3));
            };


            // Now Handle their new channel.
            if (!statsDb.voice.channels[newChannel.id]) statsDb.voice.channels[newChannel.id] = new ChannelData({ guild_id: newChannel.guild.id, channel_id: newChannel.id, name: newChannel.name });

            statsDb.voice.lastChannel = newChannel.id;
            statsDb.voice.channels[newChannel.id].stats.unshift(new ChannelStats({ joined: Date.now() }));
        };

        //Save the data to the DB.
        await statsDb.save();
    }
};
