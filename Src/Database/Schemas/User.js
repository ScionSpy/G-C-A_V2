const { DEFAULT_PREFIX } = require("../../config.js");
//const { GuildMember, Guild } = require('discord.js');
const DB = require('../index.js');


/*const Schema = new mongoose.Schema(
    {
        _id: String,
        username: String,
        discriminator: String,
        logged: Boolean,
        coins: { type: Number, default: 0 },
        bank: { type: Number, default: 0 },
        reputation: {
            received: { type: Number, default: 0 },
            given: { type: Number, default: 0 },
            timestamp: Date,
        },
        daily: {
            streak: { type: Number, default: 0 },
            timestamp: Date,
        },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);*/

class _User {

    prefix = DEFAULT_PREFIX;

    constructor(){
        this.initializing = true;

    };

    /**
     *
     * @param {UserType} options
     */
    async create(options) {
        if (!options.id || typeof options.id !== "string") throw new Error(`User class constructor requires an ID! { id:string }`);

        for(let key in options){
            this[key] = options[key];
        };

        delete this.initializing;
        return await DB._Post("UserSettings", this);
    };

    async load(id) {
        if (!id || typeof id !== "string") throw new Error(`User class function 'load' requires an id:string to execute!`);

        let data = await DB._Get("UserSettings", { id });

        if(data[0]){
            delete this.initializing;
            for(const key in data[0]){
                this[key] = data[0][key];
            };
        };

        return this;
    };

    async save() {
        return await DB._Edit("UserSettings", { id: this.id }, this);
    };
};

module.exports = {
    /**
     * @param {import('discord.js').User} user
     */
    getUser: async (user) => {
        if (!user) throw new Error("User is required.");
        if (!user.id) throw new Error("User Id is required.");

        //const cached = cache.get(user.id);
        //if (cached) return cached;

        let userDB = new _User();
        await userDB.load(user.id)
        if (userDB.initializing) {
            userDB.create({
                id: user.id,
                playerID: -1
            });
        };

        //cache.add(user.id, userDb);
        return userDB;
    },

    getReputationLb: async (limit = 10) => {
        return await DB._Get("UserSettings", { "reputation.received": { $gt: 0 } }, {}, { sort: { "reputation.received": -1, "reputation.given": 1 }, limit: 10 });
    },
};
