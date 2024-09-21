const { presenceHandler } = require("../../Handlers");
const ClanBattles = require('../../../Modules/ClanBattles/index');
const DB = require('../../../Database/index');
const Player = require('../../../Database/Schemas/Player/Player');
const DiscordPlayer = require("../../../Database/Schemas/Player/DiscordPlayer");
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
    //client.loadingMembers = true;
    await loadMembers(client);
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



async function loadMembers(bot){
    let members = await DB._Get("Members", {active:true});

    for(let x = 0; x < members.length; x++){
            let member = members[x];
            let player;
        try{
            let index = bot.Players.length;

            if (!member.discord_id){
                player = new Player({id:member.id});
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

    console.log(`Loaded ${members.length} Active members to the Cache.`);
};
