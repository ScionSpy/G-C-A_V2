const { presenceHandler } = require("../../Handlers");
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
};

const gcaEvents = [
    { enabled: true, timer: 1000 *60 *15, name: 'updateClanMembers' },
    { enabled: true, timer: 1000 *60 *15, name: 'fetchApplications' },
    { enabled: true, timer: 1000 *60 *5, name: 'fetchLastBattles', wait: nextTime.nextFifthMinute() },
    //{ enabled: false, timer: -1, name: 'navalBattles', wait: nextTime}
    //{ enabled: false, timer: -1, name: 'clanBattles', wait: nextTime}
];

function startTimers(client){


    for(let x = 0; x < gcaEvents.length; x++){
        let event = gcaEvents[x];
        if(!event.enabled) return;

        timerFunction = function () {
            client.emit(event.name, client);
        };

        if (event.wait){
            console.log(`Event: "${event.name}" is waiting ${Math.round(event.wait /1000 /60)} minutes for first fire.`);
            setTimeout(function(){
                client.emit(event.name, client);
                setInterval(timerFunction, event.timer);
            }, event.wait);

        } else{
            client.emit(event.name, client);
            setInterval(timerFunction, event.timer);
        };
    };
};
