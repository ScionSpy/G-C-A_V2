const { Clans } = require('../../../WebAPI/Wargaming/index');
const { clan_id } = require('../../../WebAPI/apiConfig.js').Wargaming;
const Player = require('../../../Database/Player.js');

let results = {
    removed: [],
    promote: [],
    demote: [],
    update: [],
    error: []
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
        new_role: member.account_name
    });
};


/**
 *
 * @param {import('../../Structures/BotClient.js')} bot
 */
module.exports = async (bot) => {
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
            removePlayer(mem);

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
                updatePlayer(mem, member);
            };
        };
        checked_ids.push(mem.id);
    };
};
