const { Player, DiscordPlayer } = require('../../../Database/Schemas/index').Players;
const Database = require('../../../Database/core');
const { Collection } = require('discord.js');

/**
 * @typedef {Object} ManagerOptions
 * @property {Number} [cacheSize] Limit the cache to this value.
 */

module.exports = class Manager {
    #cache = new Collection();
    #bot;

    constructor(bot, options){
        if(!bot || typeof bot !== "object") throw new Error(`new PlayerManager(bot, options); {bot} must be defined as  a Discord Client instance! got ${typeof bot}`);
        if (options && options.cacheSize && typeof options.cacheSize !== "number") throw new Error(`new PlayerManager(bot, option); {options.cacheSize} must be a number greater than 0! got ${typeof options.cacheSize} : ${options.cacheSize}`);

        this.#bot = bot;


        /** @type {ManagerOptions} */
        this.options = {};

        if (!options) return;
        if(options.id) this.options.cacheSize = options.cacheSize;
    };

    /**
     *
     * @param {Player | DiscordPlayer} player
     */
    #saveToCache(player, key){
        if (!key) this.#cache.set(player.id, player);
        else this.#cache.set(key, player);

        if (this.options.cacheSize){
            if(this.#cache.size > this.options.cacheSize) this.#cache.delete(this.#cache.first());
        };
    };

    getCache(){
        return this.#cache;
    };


    /**
     *
     * @param {Number} player_id 7 Digit number representing your WoWs account_id.
     */
    async get(player_id) {
        if (!player_id || typeof player_id !== "number") throw new Error(`PlayerManager.replaceEntity(player_id, newEntity); {player_id} must be a number of 7 digits. got ${typeof player_id} : ${player_id}`);
        let player = this.#cache.get(player_id);

        if(!player){
            let dbPlayer = await new Player({id:player_id});
            dbPlayer = await dbPlayer.load();

            if (!dbPlayer.discord_id) player = dbPlayer;
            else{
                let dbDiscordPlayer = await new DiscordPlayer({ id: dbPlayer.id}, this.#bot);
                dbDiscordPlayer = await dbDiscordPlayer.loadDiscord();

                player = dbDiscordPlayer;
            };
        };

        //ToDo: If(!player) player = pullFromWargamingAPI();

        this.#saveToCache(player);
        return player;
    };


    async replace(player_id, newEntity){
        if (!player_id || typeof player_id !== "number") throw new Error(`PlayerManager.replaceEntity(player_id, newEntity); {player_id} must be a number of 7 digits. got ${typeof player_id} : ${player_id}`);
        if(newEntity.constructor.name !== "Player" && newEntity.constructor.name !== "DiscordPlayer") throw new Error(`PlayerManager.replaceEntity(player_id, newEntity); {newEntity} must by of the "Player" or "DiscordPlayer" class! got a ${newEntity.constructor.name} class!`);

        let player = await this.getPlayer(player_id);
        if (!player) this.#saveToCache(newEntity);
        else this.#saveToCache(newEntity, player.id);
    };
};
