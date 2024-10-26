const { Guild } = require("discord.js");

const MEMBER_MENTION = /<?@?!?(\d{17,20})>?/;
const CHANNEL_MENTION = /<?#?(\d{17,20})>?/;


/**
 * Resolves a guild member from search query
 * @param {string} query
 * @param {boolean} exact
 */
Guild.prototype.resolveMember = async function (query, exact = false) {
    if (!query || typeof query !== "string") return;

    // Check if mentioned or ID is passed
    const patternMatch = query.match(MEMBER_MENTION);
    if (patternMatch) {
        const id = patternMatch[1];
        const fetched = await this.members.fetch({ user: id }).catch(() => { });
        if (fetched) return fetched;
    }

    // Fetch and cache members from API
    await this.members.fetch({ query }).catch(() => { });

    // Check if exact tag is matched
    const matchingTags = this.members.cache.filter((mem) => mem.user.tag === query);
    if (matchingTags.size === 1) return matchingTags.first();

    // Check for matching username
    if (!exact) {
        return this.members.cache.find(
            (x) =>
                x.user.username === query ||
                x.user.username.toLowerCase().includes(query.toLowerCase()) ||
                x.displayName.toLowerCase().includes(query.toLowerCase())
        );
    }
};

/**
 * Resolves a guild channel from search query
 * @param {string} query
 * @param {boolean} exact
 */
Guild.prototype.resolveChannel = async function (query, exact = false) {
    if (!query || typeof query !== "string") return;

    // Check if mentioned or ID is passed
    const patternMatch = query.match(CHANNEL_MENTION);
    if (patternMatch) {
        const id = patternMatch[1];
        const fetched = await this.channels.cache.get(id);
        if (fetched) return fetched;
    };

    // Check if exact tag is matched
    const matchingTags = this.channels.cache.filter((ch) => ch.name === query);
    if (matchingTags.size === 1) return matchingTags.first();

    // Check for matching username
    if (!exact) {
        return this.channels.cache.find(
            (x) =>
                x.name === query ||
                x.name.toLowerCase().includes(query.toLowerCase())
        );
    };
};

/**
 * Fetch member stats
 */
Guild.prototype.fetchMemberStats = async function () {
    const all = await this.members.fetch({
        force: false,
        cache: false,
    });
    const total = all.size;
    const bots = all.filter((mem) => mem.user.bot).size;
    const members = total - bots;
    return [total, bots, members];
};
