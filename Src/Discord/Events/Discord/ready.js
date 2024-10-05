const { presenceHandler } = require("../../Handlers");
const ClanBattles = require('../../../Modules/ClanBattles/index');
const DB = require('../../../Database/index');
const { Clans, Players } = require('../../../Database/Schemas/index');
const { DiscordPlayer, Player } = Players;
const ApiClans = require("../../../WebAPI/Wargaming").Clans;
//const { cacheReactionRoles } = require("@schemas/ReactionRoles");
//const { getSettings } = require("@schemas/Guild");

/**
 * @param {import('../../Structures').BotClient} client
 */
module.exports = async (client) => {
    console.log(`Logged in as ${client.user.tag}! (${client.user.id})`);

    // Update Bot Presence
    presenceHandler(client);

    // Load reaction roles to cache
    //await cacheReactionRoles(client);

    // startTimer clan members
    // let data = await client.emit('updateClanMembers', client);

    startTimers(client);

    //client.loadingClans = true;
    //client.loadingMembers = true;

    loadConfig(client);
    loadClans(client);
    await loadMembers(client);

    //delete client.loadingClans;
    //delete client.loadingMembers;
};


const nextTime = {
    "midnight": function (d = new Date()) {
        let ms = new Date(d).setHours(24, 0, 0, 0) - d;
        return ms;
    },
    'nextFifthMinute': function(d = new Date()){
        let coff = 1000 *60 *5;
        let nextNthMin = new Date(Math.ceil(d / coff) * coff);
        return nextNthMin - d.getTime();
    },
    'nextHour': function (d = new Date()) {
        let coff = 1000 * 60 * 60;
        let nextNthMin = new Date(Math.ceil(d / coff) * coff);
        return nextNthMin - d.getTime();
    },
    //'nextClanBattle': require()
};

const gcaEvents = [
    { enabled: false, timer: 1000 *60 *15, name: 'updateClanMembers' }, // ToDo: Update via bot.Players
    { enabled: true, timer: 1000 *60 *15, name: 'fetchApplications' },
    { enabled: true, timer: 1000 *60 *5, name: 'fetchLastBattles', wait: nextTime.nextFifthMinute() },
    //{ enabled: false, timer: -1, name: 'navalBattles', wait: nextTime}
    { enabled: true, name: 'clanBattles', customTimer: ClanBattles.setEventTimers}
];

timerFunction = function (client, event) {
    console.log('Firing event: ' + event.name + ' .timerFN() | ReFire in: ' + event.timer / 1000 / 60 + ' minutes.');
    client.emit(event.name, client);
};

function startTimers(client){
    for(let x = 0; x < gcaEvents.length; x++){
        let event = gcaEvents[x];
        if(!event.enabled) continue;

        if (event.customTimer){
            console.log(`• Event: ${event.name} executing custom timer data.`);
            event.customTimer(client);
        } else if (event.wait){
            console.log(`• Event: "${event.name}" is waiting ${Math.round(event.wait /1000 /60)} minutes for first fire.`);
            setTimeout(function () {
                console.log('Firing event: ' + event.name + ' .wait() | ReFire in: ' + event.timer / 1000 / 60 + ' minutes.');
                client.emit(event.name, client);
                if (event.timer) setInterval(function () {
                    timerFunction(client, event)
                }, event.timer);
            }, event.wait);

        } else {
            console.log('Firing event: ' + event.name + ' .timer() | ReFire in: ' + event.timer / 1000 / 60 + ' minutes.');
            client.emit(event.name, client);
            setInterval(function(){
                timerFunction(client, event)
            }, event.timer);
        };
    };
};

/**
 * @param {import('../../Structures').BotClient} bot
 */
async function loadConfig(bot){
    let Constants = require('../../../Constants');

    bot.Ranks = Constants._Ranks;
    bot.RanksDiscord = {};
    for (let index = 0; index < bot.Ranks.length; index++){
        let rank = bot.Ranks[index];
        for(let key in rank){
            bot.RanksDiscord[rank.key] = rank.discord_id ? rank.discord_id : null;
            if (key == "discord_id" && rank.Rank < 3) continue;
            bot.RanksIndex.set(rank[key], index);
        };
    };
};


/**
 * @param {import('../../Structures').BotClient} bot
 */
async function loadClans(bot) {
    let clans = await DB._Get("Clans");

    let clanIDs = [];
    let clansObj = {};

    for(let x = 0; x < clans.length; x++){
        let clan = clans[x];

        clanIDs.push(clan.clan_id);
        clansObj[clan.clan_id] = clan;
    };

    let apiClanData = await ApiClans.getDetails(clanIDs.join(','));

    for(let key in apiClanData[0]){
        let index = bot.Clans.length;

        let clanData = apiClanData[0][key];

        let data = {
            clan_id: key,
            tag: clanData.tag,
            name: clanData.name,
            leader: clanData.leader_name,
            member_ids: clanData.members_ids,

            IFF: clansObj[key].relations,
        };

        if (clansObj[key].discord && clansObj[key].discord.invite) data.invite = clansObj[key].discord.invite;
        if (clansObj[key].discord && clansObj[key].discord.ranks) data.ranks = clansObj[key].discord.ranks;
        if (apiClanData[0][key].is_clan_disbanded) data.disbanded = apiClanData[0][key].is_clan_disbanded;

        let clan = new Clans.Clan({id:key});
        clan = await clan.setData(data);
        bot.Clans.push(clan);

        bot.ClansIndex.set(key, index);
        bot.ClansIndex.set(data.tag, index);
        bot.ClansIndex.set(data.name, index);
    };

    console.log(`Loaded ${bot.Clans.length} clans to the Cache.`);
};


/**
 * @param {import('../../Structures').BotClient} bot
 */
async function loadMembers(bot){
    let members = await DB._Get("Members", {active:true});

    for(let x = 0; x < members.length; x++){
            let member = members[x];
            let player;
        try{
            let index = bot.Players.length;

            if (!member.discord_id){
                player = new Player({id:member.id}, bot);
                player = await player.load();
            } else {
                player = new DiscordPlayer({discord_id:member.discord_id}, bot);
                player = await player.loadDiscord();
            };

            if(player) bot.Players.push(player);
            else console.log(member);
            bot.PlayersIndex.set(player.id, index);
            bot.PlayersIndex.set(player.name, index);
            bot.PlayersIndex.set(player.name.toLowerCase(), index);
            if (member.discord_id) bot.PlayersIndex.set(player.discord_id, index);
        } catch(err){
            console.error(`Event.ready() Failed loading player [ ${member.id} ] to cache!`, err);
        };
    };

    console.log(`Loaded ${bot.Players.length} Active members to the Cache.`);
};


/**
 *
 * @param {import('../../Structures').BotClient} bot
 */
async function _loadMembers(bot){
    let members = await DB._get("Members", {active:true});// Load Verified rather than members???

    let member_ids = [];
    for (let x = 0; x < members.length; x++){

    };
};
