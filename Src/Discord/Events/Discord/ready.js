const { presenceHandler } = require("../../Handlers");
const ClanBattles = require('../../../Modules/ClanBattles/index');
const DB = require('../../../Database/index');
const { Clans, Players } = require('../../../Database/Schemas/index');
const { DiscordPlayer, Player } = Players;
const ApiClans = require("../../../WebAPI/Wargaming").Clans;
const ApiPlayers = require("../../../WebAPI/Wargaming").Players;
const Guild = require('../../../Database/Schemas/Guild');
const { SUPPORT_SERVER } = require("../../../config.js");
//const { cacheReactionRoles } = require("@schemas/ReactionRoles");
//const { getSettings } = require("@schemas/Guild");
const { clan_id } = require('../../../WebAPI/apiConfig.js').Wargaming;

/**
 * @param {import('../../Structures').BotClient} client
 */
module.exports = async (client) => {
    console.log(`Logged in as ${client.user.tag}! (${client.user.id})`);
    client.supportServer = await client.guilds.cache.get(SUPPORT_SERVER);

    let TIMESTAMP = Date.now();
    let users = 0;
    for (const [key, value] of client.guilds.cache) {
        await client.guilds.cache.get(key).members.fetch();
        users += client.guilds.cache.get(key).members.cache.size;
    };

    console.log(`Fetched ${users} guild members in ${Date.now() - TIMESTAMP}ms`);

    // Update Bot Presence
    presenceHandler(client);

    // Load reaction roles to cache
    //await cacheReactionRoles(client);

    // startTimer clan members
    // let data = await client.emit('updateClanMembers', client);

    //client.loadingClans = true;
    //client.loadingMembers = true;
    client.x = _loadPlayers;

    client = await loadGuildSettings(client);
    client = await loadConfig(client);
    client = await loadClans(client);
    //client = await loadMembers(client);
    client = await _loadPlayers(client);


    let clan = new Clans.Clan({ id: clan_id }, this);
    client.Clan = clan;


    startTimers(client);
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
    { enabled: true, timer: 1000 *60 *15, name: 'updateClanMembers' }, // ToDo: Update via bot.Players
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

    return bot;
};

/**
 * @param {import('../../Structures').BotClient} bot
 */
async function loadGuildSettings(bot){
    let TIMESTAMP = Date.now();

    let guilds = await bot.DB._Get("GuildSettings");

    let activeClans = [];
    for (const [key, value] of bot.guilds.cache) {
        let found;
        for (let x = 0; x < guilds.length; x++){

            if(guilds[x].id !== key) continue;
            found = guilds[x];
            break;
        };
        if (found) continue;

        bot._postNewGuild(bot.guilds.cache.get(key));

        let guild = await new Guild(await bot.guilds.cache.get(key), bot);
        guild = await guild.toggleClan(true);
        guild.save();
    };

    for (let x = 0; x < guilds.length; x++){
        if(guilds[x]?.discord?.channels){
            let chs = guilds[x].discord.channels;
            if (chs.codeGiveAways) bot.riftChannels.codeGiveAways.push(chs.codeGiveAways);
            if (chs.mercs) bot.riftChannels.codeGiveAways.push(chs.mercs);
            if (chs.rift) bot.riftChannels.codeGiveAways.push(chs.rift);
        };

        if (activeClans.includes(guilds[x])) continue;
        if (!guilds[x].status) continue;
        bot._postOldGuild(guild);
    };


    console.log(`Loaded ${bot.guilds.cache.size} guild settings to the Cache in ${(Date.now() - TIMESTAMP)}ms`);
    return bot;
};


/**
 * @param {import('../../Structures').BotClient} bot
 */
async function loadClans(bot) {
    let START_TIMESTAMP = Date.now();
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

        if (clansObj[key].discord) {
            data.discord = {};
            if (clansObj[key].discord.id) data.discord.id = clansObj[key].discord.id;
            if (clansObj[key].discord.invite) data.discord.invite = clansObj[key].discord.invite;
            if (clansObj[key].discord.ranks) data.discord.ranks = clansObj[key].discord.ranks;
        };

        if (apiClanData[0][key].is_clan_disbanded) data.disbanded = apiClanData[0][key].is_clan_disbanded;

        let clan = new Clans.Clan({id:key}, bot);
        clan = await clan.setData(data);
        bot.Clans.push(clan);

        bot.ClansIndex.set(key, index);
        bot.ClansIndex.set(data.tag, index);
        bot.ClansIndex.set(data.name, index);
        if (clan?.discord?.id) bot.ClansIndex.set(clan.discord.id, index);
    };

    console.log(`Loaded ${bot.Clans.length} clans to the Cache in ${(Date.now() - START_TIMESTAMP)}ms`);
    return bot;
};

/**
 *
 * @param {import('../../Structures').BotClient} bot
 */
async function _loadPlayers(bot) {
    let TIMESTAMP = Date.now();

    //let members = await DB._Get("Members", { active: true });
    let members = await DB._Get("Members");

    let memberIDs = [];
    let memberObjs = {};
    for (let x = 0; x < members.length; x++){
        let member = members[x];

        memberIDs.push(member.id);
        memberObjs[member.id] = member;
    };

    let apiMemberData = await ApiPlayers.getDetails(memberIDs.join(','));
    let apiMemberClanData = await ApiPlayers.getClanInfo(memberIDs.join(','));

    for (let x = 0; x < apiMemberData.length; x++){
        for (let key in apiMemberData[x]) {
            let index = bot.Players.length;

            let memberData = apiMemberData[x][key];
            let memberClanData = apiMemberClanData[x][key];

            if(!memberData || !memberData.account_id) console.log(memberData, key, apiMemberData[x][key], apiMemberData);

            let data = {
                id: memberData.account_id,
                name: memberData.nickname,
                discord_id: null,
                clan: null,
                stats: {
                    inactive: memberObjs[key].inactive,
                    loa: memberObjs[key].loa,
                    created_at: memberData.created_at,
                    lastBattle: memberData.last_battle_time,
                    lastLogOut: memberData.logout_at,
                    //duration: int
                }
            };

            if (!memberData.hidden_profile){
                data.stats.battles = memberData.statistics.battles;
                data.stats.distance = memberData.statistics.distance;
            };

            if (memberClanData.clan_id) data.clan = {
                id: memberClanData.clan_id,
                joined: memberClanData.joined_at,
                rank: memberClanData.role,
                //battles_since_join: memberData?.statistics?.battles - memberObjs[key].battlesAtClanJoin;
                clan: bot.Clans[bot.ClansIndex.get(memberClanData.clan_id.toString())]
            };


            let player;
            if(!memberObjs[key].discord_id){
                player = new Player(data, bot);
                player = await player.setData(data);
            } else {
                data.discord_id = memberObjs[key].discord_id;
                player = new DiscordPlayer(data, bot);
                player = await player.setDiscordData(data);
            };

            if (player) bot.Players.push(player);
            else console.log(data);

            bot.PlayersIndex.set(data.id, index);
            bot.PlayersIndex.set(data.name, index);
            bot.PlayersIndex.set(data.name.toLowerCase(), index);
            if (data.discord_id) bot.PlayersIndex.set(data.discord_id, index);
        };
    };

    let totalLoadingTime = 0;

    for(let x = 0; x < bot.Players.length; x++){
        let player = bot.Players[x];
        if(player.loadingTime) totalLoadingTime += player.loadingTime
    };

    console.log(`Loaded ${bot.Players.length} Members to the Cache in ${Date.now() - TIMESTAMP}ms`);
    return bot;
};

/**
 * @param {import('../../Structures').BotClient} bot
 */
async function loadMembers(bot){
    let START_TIMESTAMP = Date.now();
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

    console.log(`Loaded ${bot.Players.length} Active members to the Cache in ${(Date.now() - START_TIMESTAMP)}ms`);
};
