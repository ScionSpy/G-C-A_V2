const { Clans } = require('../../../WebAPI/Wargaming/index');
const { clan_id } = require('../../../WebAPI/apiConfig.js').Wargaming;
const Player = require('../../../Database/Player.js');


/**
 * @typedef {Object} results.added
 * @property {Number} id Player Account ID
 * @property {String} name Player Name
 * @property {String} rank Player Clan Rank
 * @property {Number} joined Time Player joined the Clan in ms.
 * @property {Number} total Time Player was with the Clan in ms.
 */

/**
 * @typedef {Object} results.removed
 * @property {Number} id Player Account ID
 * @property {String} name Player Name
 * @property {String} rank Player Clan Rank
 * @property {Number} joined Time Player joined the Clan in ms.
 * @property {Number} total Time Player was with the Clan in ms.
 */

/**
 * @typedef {Object} results.update
 * @property {Number} id Player Account ID
 * @property {String} name Player Name
 * @property {String} old_rank Previous Clan Rank of the Player.
 * @property {String} new_rank Current Clan Rank of the Player.
 */

/**
 * @typedef {Object} results.name
 * @property {Number} id Player Account ID
 * @property {String} name Player Name
 * @property {String} old_name Previous Name of the Player.
 * @property {String} new_name Current Name of the Player.
 */


/**
 * @typedef {Object} results
 * @property {Array<results.added>} results.added
 * @property {Array<results.removed>} results.removed
 * @property {Array<results.update>} results.promote
 * @property {Array<results.update>} results.demote
 * @property {Array<results.name>} results.update
 * @property {Array<Object>} results.error
 */
/**
 * @type {results}
 */
let results = {};


/**
 *
 * @param {import('../../../WebAPI/Wargaming/Calls/ClanData.js').Clan_Member} member Member joining the Clan.
 * @param {import('../../../WebAPI/Wargaming/Calls/ClanData.js').InviteData} inviteData invite the member joined with.
 */
async function addPlayer(member, inviteData){
    let player = new Player({ id: member.id });
    player.toggleClanMember(true, member.role);

    let data = {
        id: member.id,
        name: member.name,
        rank: member.role,
        joined: member.joined_at * 1000,
        inviter: inviteData ? `${inviteData.sender.id}/${inviteData.sender.name}` : 'application'
    };

    results.added.push(data);
};

/**
 *
 * @param {*} member
 */
async function removePlayer(member) {
    let player = new Player({ id: member.id });
    player.toggleClanMember();

    results.removed.push({
        id: member.id,
        name: mem.name,
        rank: member.clan_role,
        joined: member.clan_joined * 1000,
        total: Date.now() - (member.clan_joined * 1000)
    });
};

/**
 *
 * @param {*} mem
 * @param {import('../../../WebAPI/Wargaming/Calls/ClanData.js').Clan_Member} member
 */
async function updatePlayer(mem, member) {
    let player = new Player({ id: member.account_id });
    player.setName(member.account_name);

    results.update.push({
        id: member.id,
        rank: member.role,
        old_name: mem.name,
        new_name: member.account_name
    });
};


/**
 *
 * @param {import('../../Structures/BotClient.js')} bot
 */
async function updateClanMembers(bot) {
    results = {
        added: [],
        removed: [],
        promote: [],
        demote: [],
        update: []
    };

    let clans = await Clans.getDetails(clan_id);
    /**
     * @type {import('../../../WebAPI/Wargaming/Calls/ClanData.js').Clan_Info}
     */
    let clan = clans[0][clan_id];
    let dbMembers = bot.DB._Get("Members", { active: true });

    let checked_ids = [];
    for (let x = 0; x < dbMembers.length; x++) {
        let mem = dbMembers[x];
        if (!clan.members_ids.includes(mem.id)) { // Member is no longer with the clan.
            await removePlayer(mem);

        } else { // Member is still with the clan
            let member = clan.members[mem.id];
            if (mem.clan_role !== member.role) { // Member's rank has changed.
                let update = {
                    id: member.id,
                    name: mem.name,
                    old_role: mem.clan_role,
                    new_role: member.role
                };

                if (mem.clan_role < member.role) { //Member was promoted!
                    results.promote.push(update);

                } else { // Member was demoted...
                    results.demote.push(update);

                };

                this._Edit("Members", { id: mem.id }, { clan_role: member.role });
            };

            if (mem.name !== member.account_name) { // Member changed their name
                await updatePlayer(mem, member);
            };
        };
        checked_ids.push(mem.id);
    };

    for (let x = 0; x < clan.members_ids; x++) {
        let member_id = clan.members_ids[x];
        if (!checked_ids.includes(member_id)) { // Member joined the clan since last check.
            let member = clan.members[member_id];
            let invite = await bot.Clan.getInviteFor(member.name);
            await addPlayer(member, invite);
        };
    };

    return results;
};

/**
 *
 * @param {import('../../Structures/BotClient.js')} bot
 */
module.exports = async (bot) => {

    let results = await updateClanMembers(bot);
    console.log(results);

};
