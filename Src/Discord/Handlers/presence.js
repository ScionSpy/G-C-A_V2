const { Utils } = require('../Helpers');

/**
 * @typedef {Object} StatusObject
 * @param {String} status.status 'online' | 'offline' | 'idle' | 'dnd'
 * @param {String} status.type 'PLAYING' | 'LISTENING' | 'WATCHING'
 * @param {String} status.message Message to display as an activity.
 */

class Presence {
    /**
     * @property {Boolean} enabled Can the Discord Client use this presence.
     */
    enabled = false;

    #Statuses = ['ONLINE', 'OFFLINE', 'IDLE', 'DND'];
    #Activities = ['PLAYING', 'LISTENING', 'WATCHING'];

    /**
     *
     * @param {String | StatusObject} status 'ONLINE' | 'OFFLINE' | 'IDLE' | 'DND'
     * @param {String} type 'PLAYING' | 'LISTENING' | 'WATCHING'
     * @param {String} message Message to display as an activity.
     */
    constructor(status, type, message){
        if (typeof status !== "object" && typeof status !== "string") throw new Error(`Presence {status} must be an object or string! got ${typeof type}.`);
        if (typeof status === "object") {
            if (typeof status.status !== "string") throw new Error(`Presence {status.status} must be a string! got ${typeof status.status}.`);
            if (typeof statustype !== "string") throw new Error(`Presence {status.type} must be a string! got ${typeof status.type}.`);
            if (typeof status.message !== "string") throw new Error(`Presence {status.message} must be a string! got ${typeof status.message}.`);

            this.status = status.status.toUpperCase();
            this.type = status.type.toUpperCase();
            this.message = status.message;
        }else{
            if (typeof type !== "string") throw new Error(`Presence {type} must be a string! got ${typeof type}.`);
            if (typeof message !== "string") throw new Error(`Presence {message} must be a string! got ${typeof message}.`);

            this.status = status.toUpperCase();
            this.type = type.toUpperCase();
            this.message = message;
        };

        if (!this.#Statuses.includes(this.status)) throw new Error(`Presence {status} must be one of ${this.#Statuses}! Got ${this.status}`);
        if (!this.#Activities.includes(this.type)) throw new Error(`Presence {type} must be one of ${this.#Activities}! Got ${this.type}`);

        this.enabeld = true;
    };
};

const presences = [];

//presneces.push(new Presence("xxx", "xxx"));
presences.push(new Presence("DND", "PLAYING", "Battleship."));
presences.push(new Presence("DND", "PLAYING", "with Nukes."));
presences.push(new Presence("DND", "PLAYING", "with the Wargaming API."));
presences.push(new Presence("IDLE", "WATCHING", "over {players} players."));
presences.push(new Presence("IDLE", "WATCHING", "over {clans} clans."));
presences.push(new Presence("DND", "WATCHING", "the network hack Gemini's computer."));
presences.push(new Presence("DND", "PLAYING", "with Gemini's computer."));




function getNewPresence(){
    return presences[Utils.getRandomInt(presences.length)];
};


/**
 * @param {import('../Structures').BotClient} client
 */
async function updatePresence(client) {
    let activity = getNewPresence();

    if (activity.message.includes("{servers}")) {
        activity = activity.message.replaceAll("{servers}", client.guilds.cache.size);
    };

    if (activity.message.includes("{members}")) {
        const members = client.guilds.cache.map((g) => g.memberCount).reduce((partial_sum, a) => partial_sum + a, 0);
        activity.message = activity.message.replaceAll("{members}", members);
    };

    if(activity.message.includes("{players}")){
        let players = await client.DB._Get("Verified");
        activity.message = activity.message.replaceAll("{players}", players.length);
    };

    if (activity.message.includes("{clans}")) {
        let clans = await client.DB._Get("Clans");
        activity.message = activity.message.replaceAll("{clans}", clans.length);
    };

    const getType = (type) => {
        switch (type) {
            case "LISTENING":
                return "LISTENING";

            case "PLAYING":
                return "PLAYING";

            case "WATCHING":
                return "WATCHING";
        }
    };

    client.user.setPresence({
        status: activity.status,
        activity: {
            name: activity.message,
            type: getType(activity.type),
        },
    });
}

module.exports = function handlePresence(client) {
    updatePresence(client);
    setInterval(() => updatePresence(client), 10 * 60 * 1000);
};
