const DB = require('../index.js');
//const cache = new Map();

class DiscordMemberStats {

    constructor() {
        this.initializing = true;

    };

    /**
     *
     * @param {UserType} options
     */
    async create(options) {
        if (typeof options.guild_id !== "string" || typeof options.user_id !== "string") throw new Error(`User class constructor requires an ID! { guild_id:string, user_id:string };`);

        this.guild_id = undefined;
        this.user_id = undefined;
        this.messages = 0;
        this.voice = {
            connections: 0,
            time: 0,
        };
        this.command_uses = 0;
        this.code_displays = 0;
        this.xp = 0;
        this.level = 0;

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
console.log(data)
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
