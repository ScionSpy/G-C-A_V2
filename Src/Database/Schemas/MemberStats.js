const { Guild, VoiceChannel } = require('discord.js');
const DB = require('../index.js');
//const cache = new Map();

/**
 * @typedef {Object} channelStats
 * @property {Date} joined Date in miliseconds when the user joined this Voice Channel.
 * @property {Date} left Date in miliseconds when the user left this Voice Channel.
 * @property {Number} time Duration the user was in the VoiceChannel in seconds to the thousandth.
 */
class ChannelStats {
    joined = undefined;
    left = undefined;
    time = undefined;

    /**
     * @param {channelStats} data
     */
    constructor(data) {
        if (typeof data !== "object") throw new Error(`channelData param 'data' must be an object! got ${typeof data}`);

        if (data?.joined) this.joined = data.joined;
        if (data?.left) this.left = data.left;
        if (data?.time) this.time = data.time;

    };
};

/**
 * @typedef {Object} channelData
 * @property {Guild.id} guild_id
 * @property {VoiceChannel.id} channel_id
 * @property {VoiceChannel.name} name
 * @property {Array<channelStats>} stats
 */
class ChannelData {
    // channel structure
    guild_id = undefined;
    channel_id = undefined;
    name = undefined;

    // channel metrics
    stats = [];

    /**
     *
     * @param {channelData} data
     */
    constructor(data) {
        if (typeof data !== "object") throw new Error(`channelData param 'data' must be an object! got ${typeof data}`);
        if (!data.guild_id) throw new Error(`channelData must include a guild_id:string!`);
        if (!data.channel_id) throw new Error(`channelData must include a channel_id:string!`);
        if (!data.name) throw new Error(`channelData must include a name:string!`);

        this.guild_id = data.guild_id;
        this.channel_id = data.channel_id;
        this.name = data.name;

    };
};

class DiscordMemberStats {

    guild_id = undefined;
    user_id = undefined;
    messages = 0;
    /**
     * @property {Object} voice
     * @property {Number} voice.time
     * @property {Number} voice.lastChannel
     * @property {channelData} voice.channels
     */
    voice = {
        time: 0,
        lastChannel: undefined,
        channels: {}, // [{ channel_id: INT, joined:INT, left: INT, time: INT }]
    };
    command_uses = 0;
    code_displays = 0;

    constructor() {
        this.initializing = true;

    };

    /**
     *
     * @param {UserType} options
     */
    async create(options) {
        if (typeof options.guild_id !== "string" || typeof options.user_id !== "string") throw new Error(`User class constructor requires an ID! { guild_id:string, user_id:string };`);

        for (let key in options) {
            this[key] = options[key];
        };

        delete this.initializing;
        await DB._Post("MemberStats", this);
        return this;
    };

    async load(query) {
        if (!query || typeof query !== "object") throw new Error(`DiscordMemberStats class function 'load' requires a query object to execute! got ${typeof query}`);
        if (!query.guild_id || typeof query.guild_id !== "string") throw new Error(`DiscordMemberStats class function 'load' requires a query.guild_id:string to execute! got ${typeof query.guild_id}`);
        if (!query.user_id || typeof query.user_id !== "string") throw new Error(`DiscordMemberStats class function 'load' requires a query.user_id:string to execute! got ${typeof query.user_id}`);

        let data = await DB._Get("MemberStats", { guild_id: query.guild_id, user_id: query.user_id });
        if (data[0]) {
            delete this.initializing;
            for (const key in data[0]) {
                this[key] = data[0][key];
            };
        };

        return this;
    };

    async save() {
        return await DB._Edit("MemberStats", { guild_id: this.guild_id, user_id: this.user_id }, this);
    };
};

module.exports = {
    ChannelData,
    ChannelStats,

    getMemberStats: async (guildId, memberId) => {
        //const key = `${guildId}|${memberId}`;
        //if (cache.has(key)) return cache.get(key);

        let member = new DiscordMemberStats();
        member = await member.load({ guild_id: guildId, user_id: memberId });
        if (member.initializing) {
            member = member.create({
                guild_id: guildId,
                user_id: memberId,
            });
        }

        //cache.set(key, member);
        return member;
    }
};
