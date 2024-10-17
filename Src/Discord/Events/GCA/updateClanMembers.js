const { Clans } = require('../../../WebAPI/Wargaming/index');
const { clan_id } = require('../../../WebAPI/apiConfig.js').Wargaming;
const Player = require('../../../Database/Schemas/Player/Player.js');
const { Ranks } = require('../../../Constants.js');
const DiscordPlayer = require('../../../Database/Schemas/Player/DiscordPlayer.js');


/**
 * @typedef {Object} results.added
 * @property {Number} id Player Account ID
 * @property {String} name Player Name
 * @property {String} rank Player Clan Rank
 * @property {Number} joined Time Player joined the Clan in ms.
 * @property {String} inviter Method the player took to join the Clan.
 *
 * @property {results.added.oldMember|undefined} oldMember Member stats before leaving the clan.
*/
/**
 * @typedef {Object} results.added.oldMember
 * @property {Number} left_at Date in ms when the player left the clan.
 * @property {Number} duration Duration in ms, how long they were with the clan.
 * @property {String} last_rank Last rank member held in the clan.
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

let newPlayer = [];
/**
 *
 * @param {import('../../Structures/BotClient.js')} bot;
 * @param {import('../../../WebAPI/Wargaming/Calls/ClanData.js').Clan_Member} member Member joining the Clan.
 * @param {import('../../../WebAPI/Wargaming/Calls/ClanData.js').InviteData} inviteData invite the member joined with.
 */
async function addPlayer(bot, member, inviteData, bot) {
    if(newPlayer.includes(member.account_name)) return;
    newPlayer.push(member.account_name);

    let player = bot.Players[bot.PlayersIndex.get(member.id)];
    if (!player) {
        let verified = await bot.DB._Get("Verified", {name:member.account_name});
        if (verified[0]){
            player = new DiscordPlayer({ id: member.account_id }, bot);
            player.loadDiscord();
        } else {
            player = new Player({ id: member.account_id }, bot);
            player = await player.load();
        };
    };

    if(!player.name) player = await player.create(member, inviteData);
    else{
        await player.toggleClanMember(true, member.role);
    };

    if(player.discord_id) player.addMemberRole(member.role);

    let oldMember = "";
    if(player?.stats?.left) oldMember = {
        left_at: player.stats.left,
        duration: player.stats.duration,
        last_rank: player.stats.rank
    };

    let data = {
        id: member.account_id,
        name: member.account_name,
        rank: member.role,
        joined: member.joined_at * 1000,
        inviter: inviteData.sender ? `${inviteData.sender.id} / ${inviteData.sender.name}` : inviteData === 'untracked' ? inviteData : 'Application',
    };
    if(oldMember) data.oldMember = oldMember;

    results.added.push(data);
};

let oldPlayer = [];

/**
 * @param {import('../../Structures/BotClient.js')} bot;
 * @param {*} member DB Member
 */
async function removePlayer(bot, member) {
    if (oldPlayer.includes(member.account_name)) return;
    else oldPlayer.push(member.account_name);

    let player = bot.Players[bot.PlayersIndex.get(member.id)];
    if (player.discord_id && player.removeMemberRoles) player.removeMemberRole();
    player.toggleClanMember(false);

    //Remove roles
    //if (player.discord_id) await player.RemoveMemberRoles();

    results.removed.push({
        id: member.id,
        name: member.name,
        rank: member.clan_role,
        joined: member.clan_joined * 1000,
        total: Date.now() - (member.clan_joined * 1000)
    });
};

let updatedPlayer = [];

/**
 *
 * @param {import('../../Structures/BotClient.js')} bot;
 * @param {*} mem
 * @param {import('../../../WebAPI/Wargaming/Calls/ClanData.js').Clan_Member} member
 */
async function updatePlayer(bot, mem, member) {
    if (updatedPlayer.includes(member.account_name)) return;
    updatedPlayer.push(member.account_name);
    let player = new Player({ id: member.account_id }, bot);
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
            await removePlayer(bot, mem);

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
                    // ToDo: AddRoles()
                    results.promote.push(update);

                } else { // Member was demoted...
                    // ToDo: RemoveRoles()
                    results.demote.push(update);

                };

                await bot.DB._Edit("Members", { id: mem.id }, { clan_role: member.role });
            };

            if (mem.name !== member.account_name) { // Member changed their name
                await updatePlayer(bot, mem, member);
            };
        };
        checked_ids.push(mem.id);
    };

    for (let x = 0; x < clan.members_ids.length; x++) {
        let member_id = clan.members_ids[x];
        if (!checked_ids.includes(member_id)) { // Member joined the clan since last check.
            let member = clan.members[member_id];
            let application = await bot.Clan.getSavedApplications();
            let invite = await bot.Clan.getInviteFor({name:member.account_name});

            let data;
            if (application && invite){
                if(application.created_at > invite.created_at) data = application;
                else data = invite;
            } else if (application) data = application
            else if (invite) data = invite;
            else data = 'untracked'; //throw new Error(`EVENT ERROR: Event.updateClanMembers(); Member Joined by: Unknown, !application; !invite.`);

            await addPlayer(bot, member, data);
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


    let note;

    if(results.added.length > 0) results.added.forEach(result => {
        if(!result.oldMember){
            msg = `${msg}\n> :new: ${result.name} has joined the clan!`
            adminMsg = `${adminMsg}\n> :new: ${result.name} has joined the clan! \`[ Method: ${result.inviter} ]\``;
            note = `${note ? `${note} ` : ''}NEW PLAYER\nJoined at: <t:${result.joined}:d>T<t:${result.joined}:t>\nInvited By: ${result.inviter}\n\n`;
        }else{
            msg = `${msg}\n> :new: ${result.name} has rejoined the clan after ${Math.floor(result.oldMember.left_at /1000/60/60/24)} days.`
            adminMsg = `${adminMsg}\n> :new: ${result.name} has rejoined the clan after ${Math.floor(result.oldMember.left_at / 1000 / 60 / 60 / 24)} days. \`[ Method: ${result.inviter} ]\`\n> Last Rank Held : ${Ranks[result.oldMember.last_rank]}\n> Left ${Math.round(result.oldMember.left_at / 1000 / 60 / 60 / 24)} days ago. | With G-C-A for a total of ${Math.round(result.oldMember.duration / 1000 / 60 / 60 / 24)} days.`;
        };
    });

    if (results.removed.length > 0) results.removed.forEach(result => {
        msg = `${msg}\n> :warning: ${Ranks.Shorts[result.rank]} ${result.name} has left the clan after ${Math.floor(result.total /1000/60/60/24)} days!!`
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
        note = note + `NAME CHANGED\n${Ranks.Shorts[result.rank]}${result.old_name} updated their name to ${result.old_name}`;
    });

    //ToDO: "Get Channel Function" in Helpers.
    let playerUpdates = await bot.channels.cache.get('1222751535159578717');
    bot.channels.cache.get('1136014419567067166').send(msg);
    if (adminMsg !== '__**Member Changes**__') playerUpdates.send(adminMsg);
    if (note) playerUpdates.send(`<@213250789823610880>,\n`+note);
    bot.channels.cache.get('1168784020109266954').send(JSON.stringify(results, null, 4), {code:'js', split:1});
    bot.Clan = await bot.Clan._Load();
};
