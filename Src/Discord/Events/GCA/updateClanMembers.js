const { Clans } = require('../../../WebAPI/Wargaming/index');
const { clan_id } = require('../../../WebAPI/apiConfig.js').Wargaming;
const Player = require('../../../Database/Schemas/Player.js');
const { Ranks } = require('../../../Constants.js');


/**
 * @typedef {Object} results.added
 * @property {Number} id Player Account ID
 * @property {String} name Player Name
 * @property {String} rank Player Clan Rank
 * @property {Number} joined Time Player joined the Clan in ms.
 * @property {String} inviter Method the player took to join the Clan.
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
 * @property {String} old_role Previous Clan Rank of the Player.
 * @property {String} new_role Current Clan Rank of the Player.
 */

/**
 * @typedef {Object} results.name
 * @property {Number} id Player Account ID
 * @property {String} rank Player Name
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
    let player = new Player({ id: member.account_id });
    player = await player.load();
    console.log(player)
    player.toggleClanMember(true, member.role);

    let data = {
        id: member.account_id,
        name: member.account_name,
        rank: member.role,
        joined: member.joined_at * 1000,
        inviter: inviteData ? `${inviteData.sender.id} / ${inviteData.sender.name}` : 'Application'
    };

    results.added.push(data);
};

/**
 *
 * @param {*} member DB Member
 */
async function removePlayer(member) {
    let player = new Player({ id: member.id });
    player = await player.load();
    player.toggleClanMember(false);

    results.removed.push({
        id: member.id,
        name: member.name,
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
    player = await player.load();
    player.setName(member.account_name);

    results.update.push({
        id: mem.id,
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
    let dbMembers = await bot.DB._Get("Members", { active: true });

    let checked_ids = [];
    for (let x = 0; x < dbMembers.length; x++) {
        let mem = dbMembers[x];
        if(mem.id === 1073485149) console.log(mem);

        if (!clan.members_ids.includes(mem.id)) { // Member is no longer with the clan.
            await removePlayer(mem);

        } else { // Member is still with the clan
            let member = clan.members[mem.id];
            if (mem.clan_role !== member.role) { // Member's rank has changed.
                let update = {
                    id: mem.id,
                    name: mem.name,
                    old_role: mem.clan_role,
                    new_role: member.role
                };
                if (Ranks.Values[mem.clan_role] < Ranks.Values[member.role]) { //Member was promoted!
                    results.promote.push(update);

                } else { // Member was demoted...
                    results.demote.push(update);

                };

                await bot.DB._Edit("Members", { id: mem.id }, { clan_role: member.role });
            };

            if (mem.name !== member.account_name) { // Member changed their name
                await updatePlayer(mem, member);
            };
        };
        checked_ids.push(mem.id);
    };

    for (let x = 0; x < clan.members_ids.length; x++) {
        let member_id = clan.members_ids[x];
        if (!checked_ids.includes(member_id)) { // Member joined the clan since last check.
            let member = clan.members[member_id];
            let invite = await bot.Clan.getInviteFor({name:member.account_name});
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

    if(
        results.added.length == 0 &&
        results.removed.length == 0 &&
        results.promote.length == 0 &&
        results.demote.length == 0 &&
        results.update.length == 0
    ) return;

    let msg = `__**Member Changes**__`;
    let adminMsg = `__**Member Changes**__`;

    if(results.added.length > 0) results.added.forEach(result => {
        msg = `${msg}\n> :new: ${result.name} has joined the clan!`
        adminMsg = `${adminMsg}\n> :new: ${result.name} has joined the clan! [  Invite Method: ${result.inviter}  ]`
    });

    if (results.removed.length > 0) results.removed.forEach(result => {
        msg = `${msg}\n> :warning: ${Ranks.Shorts[result.rank]} ${result.name} has left the clan!`
        //ToDo: Admin once dashboard is set up.
        //adminMsg = `${adminMsg}\n> :warning: ${Ranks.Shorts[result.rank]} ${result.name} has left the clan!`
    });

    if (results.promote.length > 0) results.promote.forEach(result => {
        msg = `${msg}\n> :chart_with_upwards_trend: ${result.name} was promoted from __**${Ranks[result.old_role]}**__ to __**${Ranks[result.new_role]}**__`;
        //ToDo: Admin once dashboard is set up.
        //adminMsg = `${adminMsg}\n> :chart_with_upwards_trend: ${result.name} was promoted from __**${Ranks[result.old_role]}**__ to __**${Ranks[result.new_role]}**__`;
    });

    if (results.demote.length > 0) results.demote.forEach(result => {
        msg = `${msg}\n> :chart_with_downwards_trend: ${result.name} was demoted from __**${Ranks[result.old_role]}**__ to __**${Ranks[result.new_role]}**__`;
        //ToDo: Admin once dashboard is set up.
        //adminMsg = `${adminMsg}\n> :chart_with_downwards_trend: ${result.name} was demoted from __**${Ranks[result.old_role]}**__ to __**${Ranks[result.new_role]}**__`;
    });

    if (results.update.length > 0) results.update.forEach(result => {
        msg = `${msg}\n> :gear: ${Ranks.Shorts[result.rank]} ${result.old_name} has been updated!`
        adminMsg = `${adminMsg}\n> :gear: ${Ranks.Shorts[result.rank]} ${result.old_name} has updated their name! [  New Name: ${result.new_name}  ]`
    });

    //ToDO: "Get Channel Function" in Helpers.
    bot.channels.cache.get('1136014419567067166').send(msg);
    if (adminMsg !== '__**Member Changes**__') bot.channels.cache.get('1222751535159578717').send(adminMsg);
    bot.channels.cache.get('1168784020109266954').send(JSON.stringify(results, null, 4));
};
