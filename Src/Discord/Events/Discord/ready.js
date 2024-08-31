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


const gcaEvents = [
    { enabled: true, timer: 1000*60*15, name: 'updateClanMembers' },
    { enabled: true, timer: 1000*60*15, name: 'fetchApplications' },
];

function startTimers(client){


    for(let x = 0; x < gcaEvents.length; x++){
        let event = gcaEvents[x];
        if(!event.enabled) return;

        client.emit(event.name, client);

        setInterval(function () {
            client.emit(event.name, client);
        }, event.timer);
    };
};
