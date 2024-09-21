const Config = require('./config');
const { Clans, Extras } = require('../../WebAPI/Wargaming/index');
const Battle = require('./Classes/Battle.js');

const time_OneDay = 1000 * 60 * 60 * 24;
async function timeUntilMidnight(d = new Date()) {
    let ms = new Date(d).setHours(24, 0, 0, 0) - d;
    return ms;
};

function getExtraTime(nextClanBattle, d = new Date()) {
    let extraTime = 0;

    if (nextClanBattle < 600000) {
        switch (d.getDay()) {
            case (0): // Sunday
                extraTime = time_OneDay * 3; break;
            case (3): // Wednesday
                extraTime = time_OneDay; break;
            case (4): // Thursday
                extraTime = time_OneDay * 2; break;
            case (6): // Saturday
                extraTime = time_OneDay; break;
        };
    } else {
        switch (d.getDay()) {
            case (1): // Monday
                extraTime = time_OneDay * 2; break;
            case (2): // Tuesday
                extraTime = time_OneDay; break;
            case (5): // Friday
                extraTime = time_OneDay; break;
        };
    };

    return extraTime;
};

async function clanBattleTimer() {
    let start = new Date(Config.Dates.Start);
    let end = new Date(Config.Dates.End);

    if (!start || isNaN(start.getTime())) start = 0;
    if (!end || isNaN(end.getTime())) end = 0;

    if (Date.now() > end.getTime()) return null; // Prevents clan Battle timer once the season ends.

    let nextClanBattle = await timeUntilMidnight();
    if ((start.getTime() - Date.now()) > nextClanBattle) return (start.getTime() - Date.now()) - 600000;
    if (nextClanBattle > 2147483647) return null; // time exceeds maximum allowed "Timer" duration.


    let extraTime = getExtraTime(nextClanBattle);
    nextClanBattle = nextClanBattle + extraTime;


    //nextClanBattle = nextClanBattle;

    // ClanBattles last entry is 11:30PM EST, 'nextClanBattle' is set to refernce 'Midnight' of clan battle day.
    // WoWs battles can last a maximum of 20 minutes, stating the last possible second being 11:50PM EST,
    // so we need to subtract 10 minutes from our clock.
    if (nextClanBattle < 6000000) {
        extraTime = getExtraTime();
        nextClanBattle = nextClanBattle + extraTime;
    };

    return nextClanBattle - 600000;
};

async function callToArms_Timer() {
    let callToArms = {};
    callToArms.first = await clanBattleTimer() - (1000 * 60 * 60 * 4 + 1000 * 60 * 50);
    callToArms.second = await clanBattleTimer() - (1000 * 60 * 60 * 4 + 1000 * 60 * 25);

    if (callToArms.first < 0) callToArms.first = null;
    if (callToArms.second < 0) callToArms.second = null;
    return callToArms;
};


async function setEventTimers(client) {
    let bot = client;
    console.log(`> Starting ClanBattles timer.`);
    let clanBattlesTimer = await clanBattleTimer();

    if (!clanBattlesTimer || clanBattlesTimer === null) return console.log(`ClanBattles timer == null [CB Season has ended, or the new season is longer than 25 days away!]`);

    // Verify that the "next Battle" is not after end of season.
    let seasonEnd = new Date(Config.Dates.End);
    if ((Date.now() + clanBattlesTimer) > seasonEnd.getTime()) return console.log(`<@213250789823610880>, Next ClanBattle timer is greater than endOf CB Season!\n> \`(${Date.now()} + ${clanBattlesTimer}) (= ${(Date.now() + clanBattlesTimer)}) > ${seasonEnd.getTime()}) = ${(Date.now() + clanBattlesTimer) > seasonEnd.getTime()}\``);

    console.log(`> • Clan Battles timer firing in DD days HH hours MM minutes SS seconds.`
        .replace('DD', Math.floor(clanBattlesTimer / 1000 / 60 / 60 / 24))
        .replace('HH', Math.floor(clanBattlesTimer / 1000 / 60 / 60) % 24)
        .replace('MM', Math.floor(clanBattlesTimer / 1000 / 60) % 60)
        .replace('SS', Math.floor(clanBattlesTimer / 1000) % 60)
    );

    let date = new Date();
    let TODAY = `${date.getFullYear()}-${date.getMonth() + 1 > 9 ? date.getMonth + 1 : `0${date.getMonth() + 1}`}-${date.getDate()}`;

    //Sets the results timer.
    setTimeout(async function () { //Get time until next Clan Battle!
        //If
        if (!Config.Dates.SkipDays.includes(TODAY)) bot.emit('clanBattles', bot, 'results');
        // if(NOW > END_DATE) return;
        setEventTimers(client);

    }, clanBattlesTimer);


    // clanBattlesTimer = '11:50
    // callToArms = '7:00'
    let callToArms = await callToArms_Timer();
    if (!callToArms.first && !callToArms.second) return;

    if(callToArms.first){
        console.log(`> • Clan Battles [Call to Arms] timer firing in DD days HH hours MM minutes SS seconds.`
            .replace('DD', Math.floor(callToArms.first / 1000 / 60 / 60 / 24))
            .replace('HH', Math.floor(callToArms.first / 1000 / 60 / 60) % 24)
            .replace('MM', Math.floor(callToArms.first / 1000 / 60) % 60)
            .replace('SS', Math.floor(callToArms.first / 1000) % 60)
        );

        //Sets the "Call to Arms" timer.
        setTimeout(async function () {
            if (!Config.Dates.SkipDays.includes(TODAY)) bot.emit('clanBattles', bot, 'callToArms');
        }, callToArms.first);
    };

    if (callToArms.second) {
        console.log(`> • Clan Battles [Call to Arms _ Extras] timer firing in DD days HH hours MM minutes SS seconds.`
            .replace('DD', Math.floor(callToArms.second / 1000 / 60 / 60 / 24))
            .replace('HH', Math.floor(callToArms.second / 1000 / 60 / 60) % 24)
            .replace('MM', Math.floor(callToArms.second / 1000 / 60) % 60)
            .replace('SS', Math.floor(callToArms.second / 1000) % 60)
        );

        //Sets the "Call to Arms" timer.
        setTimeout(async function () {
            if (!Config.Dates.SkipDays.includes(TODAY)) bot.emit('clanBattles', bot, 'callToArms_extra');
        }, callToArms.second);
    };
};


let results = [ { name:"maps", list:[] }, { name: "wins", wins: 0, losses: 0 }, { name: "losses", wins: 0, losses: 0 }];
function resultsHas(title){
    for(let x = 0; x < results.length; x++){
        let key = results[x];
        if(key.name === title) return x;
    };
    return false;
};

function resultsHas2(title) {
    for (let x = 0; x < results[results.length -3].list.length; x++) {
        let key = results[results.length - 3].list;
        if (key.name === title) return x;
    };
    return false;
};

/**
 * @param {Number} type Division to pull clanbattle results for.
 * * 1 = "Alpha"
 * * 2 = "Bravo"
 * @returns
 */
async function fetchBattles(type) {
    let clanBattles = await Clans.getClanBattles(type);
    //this.existingClanBattleIDs = this.#bot // pull saved clan battles.
    // pull all battle ID's for this season.
    // save to array.
    //Later filter "if (array includes thisBattleID) break."

    let Now = Date.now();
    let cutOff = Config.getLastNthHours; //1000 * 60 * 60 * 19;
    let battlesSince = new Date();
    battlesSince.setTime(Date.now() - cutOff);
    console.log(`>> Fetching Clan Battles since: ${battlesSince}`);

    let battles = {};
    if (results.length > 2) results = [{ name: "maps", list:[]}, { name: "wins", wins: 0, losses: 0 }, { name: "losses", wins: 0, losses: 0 }];
    let ships = {
        //ship_id = {type: Str:, arena_id: int = [{team:Str, player_id: int}]
    };
    let shipList = [];
    let clanTags = {
        //clan_id = {tag: Str, arena_iD: int = [team:Str, player_id: int]};
    }
    let clanList = "";

    let ignoredClans = [];


    function setShip(player, arena_id, team) {
        if (!ships[player.ship.id]) ships[player.ship.id] = { type: "", arenas: {}};
        if (!ships[player.ship.id].arenas[arena_id]) ships[player.ship.id].arenas[arena_id] = [];
        ships[player.ship.id].arenas[arena_id].push({ team, id: player.id });

        if(!shipList.includes(player.ship.id)) shipList.push(player.ship.id);
    };

    function setClan(player, arena_id, team) {
        if (!clanTags[player.clan_id]) clanTags[player.clan_id] = { tag: "", arenas:{} };
        if (!clanTags[player.clan_id].arenas[arena_id]) clanTags[player.clan_id].arenas[arena_id] = [];
        clanTags[player.clan_id].arenas[arena_id].push({ team, id: player.id });

        if (!clanList.includes(player.clan_id)) clanList.push(player.clan_id);
    };

    for (let x = 0; x < clanBattles.length; x++) {
        let battle = new Battle(clanBattles[x]);
        battle = await battle.load();

        let battletime = Date.parse(battle.finished_at);
        if ((Now - battletime) > cutOff) {
            lastBattle = (Now - battletime) / 1000 / 60 / 60 / 19 //Default
            if(!Config.getAllBattles) break; //Comment this line to gather "ALL" battles.
        };

        battles[battle.arena_id] = battle;

        let index = resultsHas(battle.axis.clan.tag);
        if (!results[index]){
            results.unshift({ name: battle.axis.clan.tag, wins: 0, losses: 0 });
            index = 0;
        };

        let battleIndex = resultsHas2(battle.map);
        if (!results[results.length - 3].list[battleIndex]) {
            results[results.length - 3].list.unshift({ name: battle.map, wins: 0, losses: 0 });
            battleIndex = 0;
        };

        if (battle.isVictory === 'Victory'){
            results[results.length - 3].list[battleIndex].wins++;
            results[results.length -2].wins++
            results[index].wins++

        } else {
            results[results.length - 3].list[battleIndex].losses++;
            results[results.length - 1].losses++;
            results[index].losses++
        };

        for (let y = 0; y < battle.allies.players.length; y++) {
            let player = battle.allies.players[y];
            if (player.clan_id !== battle.allies.clan.id) setClan(player, battle.arena_id, 'allies'); //Need to search GCA then compare non members by player name/id... Clan_ID's are showing up as "Clan faught for".
            setShip(player, battle.arena_id, 'allies');
        };


        for (let y = 0; y < battle.axis.players.length; y++) {
            let player = battle.axis.players[y];

            if (battle.axis.clan.realm === "us"){
                if (player.clan_id !== battle.axis.clan.id) setClan(player, battle.arena_id, 'axis');
            }else{
                //ToDO: Handel non-US clans Search.
                if (!ignoredClans.includes(battle.axis.clan.id)) {
                    console.log(`•• Clan is not US Region: Skipping clanSearch. ${battle.axis.clan.id} - ${battle.axis.clan.realm} - [${battle.axis.clan.tag}] ${battle.axis.clan.name}`);
                    ignoredClans.push(battle.axis.clan.id);
                };
            };
            setShip(player, battle.arena_id, 'axis');
        };
    };


    //#region Set Ship/Clan Data
    let ShipData = [];
    let ClanData = [];
    if (shipList.length > 0) ShipData = await Extras.getShipData(shipList.join(','));
    if (clanList.length > 0) ClanData = await Clans.getDetails(clanList.join(','));
    for (let key in ShipData[0]) {
        let ship = ShipData[0][key];
        ships[key].type = ship.type;
    };
    //console.log(ships)

    for (let key in ClanData[0]) {
        let clan = ClanData[0][key];
        clanTags[key].tag = clan.tag;
    };

    for (let key in ships) {
        let ShipClass = ships[key].type;
        let ship = ships[key].arenas;
        for (let arena_id in ship) {
            if (arena_id !== "type") await battles[arena_id].setShipClass(ShipClass, ship[arena_id]);
        };
    };

    for (let key in clanTags) {
        let clan = clanTags[key];
        for (let arena_id in clan) {
            if (arena_id !== "tag") await battles[arena_id].setClanTag(clan.tag, clan[arena_id]);
        };
    };
    //#endregion

    // Start Battle Formatting for Embeds
    let Embeds = [];
    let last_battle;

    for (let arena_id in battles) {
        let battle = battles[arena_id];

        /*if(last_battle) {
            let samePlayers = [];

            for(let x = 0; x < battle.allies.players.length; x++){
                let player = battle.allies.players[x];
                for(let y = 0; y < last_battle.players.length; y++){
                    let oldPlayer = last_battle.players[y];

                    if(player.name === oldPlayer.name){
                        samePlayers.push(player.name);
                    };
                };
            };

        };*/

        let embed = await battle.formatEmbed();
        Embeds.unshift(embed);

        /*last_battle = {};
        last_battle.arena_id = arena_id;
        last_battle.players = [];
        for(let x = 0; x < battle.allies.players.length; x++){
            let player = battle.allies.players[x];
            last_battle.players.push({
                id: player.id,
                name: player.name,
                ship: player.ship.name
            });
        };*/
    };

    return { results, Embeds };
};


module.exports = {
    //battles: [],
    //players = [];
    setEventTimers,
    fetchBattles,
};
