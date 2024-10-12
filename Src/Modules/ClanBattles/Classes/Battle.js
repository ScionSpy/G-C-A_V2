const Config = require('../config');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const Maps = require('../Maps/index');


/**
 * @typedef {Object} ClanBattle.Team
 *
 * @property {ClanBattle.Team.Clan} clan This team's Clan.
 * @property {ClanBattle.Team.Rating} rating This team's Rating.
 *
 * @property {String} division This teams Division.
 * * "Alpha"
 * * "Bravo"
 *
 * @property {String} result This team's outcome in this battle.
 * * "Victory"
 * * "Defeat"
 *
 * @property {Array<ClanBattle.Team.Players>} players Players that participated for this team on this battle.
*/
/**
 * @typedef {Object} ClanBattle.Team.Clan
 * @property {String} id This Clan's ID.
 * @property {String} tag This Clan's Tag.
 * @property {String} name This Caln's Name.
 * @property {String} realm This Clan's Server Region.
*/
/**
 * @typedef {Object} ClanBattle.Team.Rating
 * @property {Number} team_number This teams Division.
 * * 1 = "Alpha"
 * * 2 = "Bravo"
 * @property {Number} league This Teams Rating 0-4
 * @property {Number} division This Teams Group 1-3
 * @property {Number} division_rating This Teams Group Rating 0-100
 * @property {Number} delta How much this team's rating changed after this battle.
 * @property {Boolean} isStruggle Is this team in an active Struggle?
 * @property {Array<Boolean>} [struggle] This team's Struggle Rating.
*/
/**
 * @typedef {Object} ClanBattle.Team.Players
 * @property {String} name This Players Name.
 * @property {ClanBattle.Team.Players.Ship} ship Ship this player is running.
 * @property {Boolean} survived Did this player survive the battle?
 * @property {Number} clan_id This Player's ClanID
 * @property {String} [clan_tag] This Player's ClanTag
 * @property {Number} id This Players ID
*/
/**
 * @typedef {Object} ClanBattle.Team.Players.Ship
 * @property {Number} id ID of the ship this player's running.
 * @property {String} type Class of the ship this player's running.
 * @property {String} name Name of the ship this player's running.
 * @property {Number} tier Tier of the ship this player's running.
*/

class ClanBattle_Team {
    /**
     * @param {ClanBattle.Team} team
     */
    constructor(team){
        this.clan = {
            id: team.clan_id,
            tag: team.claninfo.tag,
            name: team.claninfo.name,
            realm: team.claninfo.realm
        };

        this.rating = {
            team_number: team.team_number,
            league: Config.Leagues[team.league],
            division: Config.Tiers[team.division],
            division_rating: team.division_rating,
            delta: team.rating_delta > 0 ? `+${team.rating_delta}` : team.rating_delta,
            isStruggle: team.stage ? true : false,
            struggle: team.stage ? team.stage : null
        };

        this.division = team.division;
        this.result = team.result;

        this.players = team.players;

        this.needsLoading = true;
    };

    async load(){
        this.players = await this.#cleanPlayers();
        delete this.needsLoading;
        return this;
    };

    async #cleanPlayers(){
        if(!this.needsLoading) return this.players;
        let players = [];
        //let filteredPlayers = [];
        for(let x = 0; x < this.players.length; x++){
            let player = this.players[x];
            players.push({
                name: player.name,
                ship: {
                    id: player.vehicle_id,
                    name: player.ship.name,
                    tier: player.ship.level
                },
                survived: player.survived,
                clan_id: player.clan_id ? player.clan_id : null,
                id: player.spa_id,
            });
        };
        return players;
    };

    /**
     * @param {Boolean} title Is this call for an embed Title?
     * @returns {String}
     */
    getRating(title) {
        let team = "";
        if(title) team = `${this.rating.team_number == 1 ? "Alpha" : "Bravo"} Div:`;
        else team = `(${this.rating.team_number == 1 ? "Alpha" : "Bravo"})`;

        return `${team} ${this.rating.league} ${this.rating.division} (${this.rating.division_rating} / 100)`;
    };

    /**
     * @typedef {Object} Struggle
     * @property {String} type What is this Struggle for?
     * * "Struggle to stay in the League."
     * * "{Stage_Promotion_League_Title.Text}"
     * @property {Array<String>} Struggle results thus far.
     */
    /**
     * @returns {Struggle}
     */
    getStage() {
        if (!this.rating.isStruggle) return false;
        let struggle = {
            type: "",
            results: []
        };

        let stage = this.rating.struggle;
        struggle.type = stage.type == "promotion" ? `{Stage_Promotion_League_Title.Text}` : `Struggle to stay in the League.`;
        for(let x = 0; x<stage.progress.length; x++){
            struggle.results[x] = stage.progress[x] == 'victory' ? "★ " : "✩ ";
        };

        return struggle;
    };

    getPlayerList(){
        let players = []

        for(let x = 0; x<this.players.length; x++){
            let player = this.players[x];
            let name = player.name;
            if(player.clan_id !== this.clan.id) name = player.clan_tag ? `[${player.clan_tag}]` : '' + name;
            players.push(`${name}\n${player.survived ? '+' : '-'} ${Config.Tiers[player.ship.tier]} (${Config.ShipClass[player.ship.type]}) ${player.ship.name}`);
        };

        return players.join("\n\n");
    };
};

module.exports = class Battle {

    /** @property {Number} arena_id */
    arena_id = 0;

    /** @property {Date} finished_at Time the battle finished. */
    finished_at = 0;

    /**
     * @property {String} isVictory was this battle a victory?
     * * "Victory"
     * * "Defeat"
    */
    isVictory = null;

    /** @property {Number} season_id Season ID this battle was in.*/
    season_id = 0;

    /** @property {String} map Map name this battle was played on. */
    map = "";

    allies;
    axis;

    #battle
    #teamGCA = 0;
    constructor(battle){
        this.#battle
        this.map = battle.map.name;
        this.arena_id = battle.arena_id;
        this.finished_at = battle.finished_at;
        this.season_id = battle.season_id;

        this.#teamGCA = battle.teams[0].clan_id == 1000101905 ? this.#teamGCA = 0 : this.#teamGCA = 1;
        this.isVictory = battle.teams[this.#teamGCA].result == "victory" ? 'Victory' : 'Defeat';
        this.allies = new ClanBattle_Team(battle.teams[this.#teamGCA]);
        this.axis = new ClanBattle_Team(battle.teams[this.#teamGCA == 0 ? 1 : 0]);
        //this.filteredPlayers = this.allies.filteredPlayers.concat(this.axis.filteredPlayers);

        this.needsLoading = true;
    };

    async load(){
        this.allies = await this.allies.load();
        this.axis = await this.axis.load();
        delete this.needsLoading;
        return this;
    };



    /**
     * @typedef {Object} setTypeData
     * @property {Number} player_id
     * @property {String} team
     * * "allies"
     * * "axis"
     */
    /**
     * @param {String} shipClass
     * @param {Array<setTypeData>} data
     */
    async setShipClass(shipClass, data){
        for(let x = 0; x < data.length; x++){
            let player = data[x];
            for(let y = 0; y < this[player.team].players.length; y++){
                let member = this[player.team].players[y];
                if(member && member.id == player.id) member.ship.type = shipClass;
            };
        };
        return this;
    };
    /**
     *
     * @param {String} clanTag
     * @param {Array<setTypeData>} data
     */
    async setClanTag(clanTag, data) {
        for (let x = 0; x < data.length; x++) {
            let player = data[x];
            for (let y = 0; y<this[player.team].players.length; y++) {
                let member = this[player.team].players[y];
                if (member.id == player.id) member.clanTag = clanTag;
            };
        };
        return this;
    };

    /** @param {MessageEmbed} Embed */
    async setMapImage(Embed){
        let map = this.map.toLowerCase().replace(/ /g, '_').replace(/\'/g, '');
        try{
            let image = Maps[map];
            if(image){
                let attachment = new MessageAttachment(image, `${map}.jpg`);
                Embed.attachFiles(attachment);
                Embed.setThumbnail(`attachment://${map}.jpg`);
            };
        }catch(err){
            console.err(`ClanBattles: Failed to attach image file to embed! -> Map Name: ${map}\n`, err);
        };

        return Embed;
    };

    /**
     * @returns {MessageEmbed}
     */
    async formatEmbed(){
        let embed = new MessageEmbed();

        embed.setTitle(`${this.isVictory}! (${this.allies.rating.delta}) on ${this.map}\n${this.allies.getRating(true)}`);
        embed = await this.setMapImage(embed);
        embed.setColor(this.isVictory == "Victory" ? "228B22" : "800000");
        embed.setTimestamp(this.finished_at);

        let stage = this.allies.getStage();
        if (stage) embed.addField(stage.type, `\`\`\`js\n${stage.results.length === 0 ? `Entered the Struggle` : stage.results.join(" ")}\`\`\``);

        embed.addField(`[${this.allies.clan.tag}]\n${this.allies.clan.name}\n• ${this.allies.getRating()}`, `\`\`\`diff\n${this.allies.getPlayerList()}\`\`\``, true);
        embed.addField(`[${this.axis.clan.tag}]\n${this.axis.clan.name}\n• ${this.axis.getRating()}`, `\`\`\`diff\n${this.axis.getPlayerList()}\`\`\``, true);

        //embed.addField(`[${this.allies.clan.tag}] ${this.allies.clan.name}\n• ${this.allies.getRating()}`, `\`\`\`diff\n${this.allies.getPlayerList()}\`\`\``, true);
        //embed.addField(`[${this.axis.clan.tag}] ${this.axis.clan.name}\n• ${this.axis.getRating()}`, `\`\`\`diff\n${this.axis.getPlayerList()}\`\`\``, true);

        return embed;
    };

    /**
     * @typedef {Object} PlayerClanData
     * @property {Number} team Team this player was on.
     * @property {Number} id Player's ID.
     * @property {Number} clan_id Player's Clan ID.
     * @property {String} clan_tag Player's Clan Tag.
     */
    /**
     * @param {Array<PlayerClanData>} Players
     */
    /*updatePlayerClan(Players){
        for(let x = 0; x<Players.length;x++){
            let player = Players[x];

        };
    };*/
};
/*

{
    "teams": [
        {
            "league": 4,
            "claninfo": {
                "tag": "G-C-A",
                "realm": "us",
                "members_count": 32,
                "id": 14980390,
                "disbanded": false,
                "name": "Gemini's Comrades in Arms",
                "color": "#cc9966",
                "hex_color": "#cc9966"
            },
            "clan_id": 1000101905,
            "result": "victory",
            "division_rating": 65,
            "division": 3,
            "players": [
                {
                    "clan_id": 1000101905,
                    "result_id": 14980390,
                    "spa_id": 1012934883,
                    "ship": {
                        "name": "Baltimore",
                        "icons": {
                            "dead": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_dead/PASC108_26c51d68518b8c145fd0588a6a07523921da1f72c0aad1df559b8344fb898afa.png",
                            "alive": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_alive/PASC108_b35ee7117eb94a9011ba644e9df11dc82d70c603e1b6efab437ea622475387a3.png"
                        },
                        "level": 8
                    },
                    "survived": false,
                    "name": "Reddawggggg",
                    "vehicle_id": 4181637104,
                    "nickname": "Reddawggggg"
                },
                {
                    "clan_id": 1000101905,
                    "result_id": 14980390,
                    "spa_id": 1043485157,
                    "ship": {
                        "name": "Baltimore",
                        "icons": {
                            "dead": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_dead/PASC108_26c51d68518b8c145fd0588a6a07523921da1f72c0aad1df559b8344fb898afa.png",
                            "alive": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_alive/PASC108_b35ee7117eb94a9011ba644e9df11dc82d70c603e1b6efab437ea622475387a3.png"
                        },
                        "level": 8
                    },
                    "survived": true,
                    "name": "BejebaSpy",
                    "vehicle_id": 4181637104,
                    "nickname": "BejebaSpy"
                },
                {
                    "clan_id": 1000101905,
                    "result_id": 14980390,
                    "spa_id": 1014082642,
                    "ship": {
                        "name": "Cossack",
                        "icons": {
                            "dead": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_dead/PBSD517_62e615cc05eff110fc867f2c09d61729daf0c9c569e15be1ea460895d59eb673.png",
                            "alive": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_alive/PBSD517_6630c68129b8929632c0eca0b4a4497b879c68ff0a8539137cb32021a94b8065.png"
                        },
                        "level": 8
                    },
                    "survived": true,
                    "name": "B_Grizzwald",
                    "vehicle_id": 3752736720,
                    "nickname": "B_Grizzwald"
                },
                {
                    "clan_id": 1000101905,
                    "result_id": 14980390,
                    "spa_id": 1057061091,
                    "ship": {
                        "name": "Massachusetts B",
                        "icons": {
                            "dead": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_dead/PASB598_cc105707184996380eb4762994b581255f7c82a5fe44cb9f91d88a938971d9e6.png",
                            "alive": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_alive/PASB598_7d6c98d9b0a21c67399c1e0ad410507353687530dc0d27f72f214b2949a7c730.png"
                        },
                        "level": 8
                    },
                    "survived": true,
                    "name": "Undead_Zaraki",
                    "vehicle_id": 3667867632,
                    "nickname": "Undead_Zaraki"
                },
                {
                    "clan_id": 1000101905,
                    "result_id": 14980390,
                    "spa_id": 1019897655,
                    "ship": {
                        "name": "Wichita",
                        "icons": {
                            "dead": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_dead/PASC508_6768bd79cf2c397cef64f483349db9d8d8acc6b9d5db60a9fd126a01f42cd4e2.png",
                            "alive": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_alive/PASC508_9e4ba84150f708daef4cf21b3f8c63341e52618bbecff56fd96de2330a52849f.png"
                        },
                        "level": 8
                    },
                    "survived": false,
                    "name": "Golderwolfen",
                    "vehicle_id": 3762206704,
                    "nickname": "Golderwolfen"
                },
                {
                    "clan_id": 1000101905,
                    "result_id": 14980390,
                    "spa_id": 1056386459,
                    "ship": {
                        "name": "Baltimore",
                        "icons": {
                            "dead": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_dead/PASC108_26c51d68518b8c145fd0588a6a07523921da1f72c0aad1df559b8344fb898afa.png",
                            "alive": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_alive/PASC108_b35ee7117eb94a9011ba644e9df11dc82d70c603e1b6efab437ea622475387a3.png"
                        },
                        "level": 8
                    },
                    "survived": false,
                    "name": "Kermode_1",
                    "vehicle_id": 4181637104,
                    "nickname": "Kermode_1"
                },
                {
                    "clan_id": 1000101905,
                    "result_id": 14980390,
                    "spa_id": 1043485149,
                    "ship": {
                        "name": "Z-23",
                        "icons": {
                            "dead": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_dead/PGSD108_0938c4fd15ca07afe319df17a093d888739fbd80c61eabd52799b5619b2df05a.png",
                            "alive": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_alive/PGSD108_3476721318dbe1c3d22c16e79e83931f7b36ef639c175811b58aa3be36bf50fc.png"
                        },
                        "level": 8
                    },
                    "survived": true,
                    "name": "ShadowSpyy",
                    "vehicle_id": 4181604144,
                    "nickname": "ShadowSpyy"
                }
            ],
            "id": 14980390,
            "team_number": 2,
            "rating_delta": 28,
            "stage": null
        },
        {
            "league": 4,
            "claninfo": {
                "tag": "OCLAM",
                "realm": "us",
                "members_count": 46,
                "id": 14980389,
                "disbanded": false,
                "name": "OnlyClams.boats",
                "color": "#cc9966",
                "hex_color": "#cc9966"
            },
            "clan_id": 1000045051,
            "result": "defeat",
            "division_rating": 61,
            "division": 2,
            "players": [
                {
                    "clan_id": 1000045051,
                    "result_id": 14980389,
                    "spa_id": 1046604608,
                    "ship": {
                        "name": "Constellation",
                        "icons": {
                            "dead": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_dead/PASB538_018bf120a3ebac1531dad5a4c892e4655f8ac13267b50c42ef2c933b424c2d29.png",
                            "alive": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_alive/PASB538_4ae208674b1c46d4b6fb5dbc604d953ffe967be655cc21e95202d7b42d7cfd1d.png"
                        },
                        "level": 8
                    },
                    "survived": false,
                    "name": "Messigno",
                    "vehicle_id": 3730782192,
                    "nickname": "Messigno"
                },
                {
                    "clan_id": 1000045051,
                    "result_id": 14980389,
                    "spa_id": 1001966881,
                    "ship": {
                        "name": "Le Terrible",
                        "icons": {
                            "dead": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_dead/PFSD508_f0b76439555ea4b5d148334866ee5db03860288450adaffd5092612a374994b9.png",
                            "alive": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_alive/PFSD508_5a48749a40d63df17fcc3dc204049d4965e57ddc9f28e3066a0a36301032e6f4.png"
                        },
                        "level": 8
                    },
                    "survived": false,
                    "name": "BuNcH007",
                    "vehicle_id": 3762173776,
                    "nickname": "BuNcH007"
                },
                {
                    "clan_id": 1000045051,
                    "result_id": 14980389,
                    "spa_id": 1027848642,
                    "ship": {
                        "name": "Akizuki",
                        "icons": {
                            "dead": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_dead/PJSD108_06eca024bfdf5961aa66796389614e5c25e08b77f77f2d5dd3cbcdd4d8a3e02a.png",
                            "alive": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_alive/PJSD108_58e2daedb6025d8792cf5989f9c47937c5fe88d4141c7778ad248a29f4669c98.png"
                        },
                        "level": 8
                    },
                    "survived": false,
                    "name": "NipplessCage",
                    "vehicle_id": 4181604048,
                    "nickname": "NipplessCage"
                },
                {
                    "clan_id": 1000045051,
                    "result_id": 14980389,
                    "spa_id": 1003543817,
                    "ship": {
                        "name": "HSF Harekaze",
                        "icons": {
                            "dead": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_dead/PJSD708_5abdac3e0317d8739912c8bb8b315ed3ddeee11aabc71ba569f786f2eddeab15.png",
                            "alive": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_alive/PJSD708_355e51c0c5738677e7bbed1f2bc85cf9617f5025ca7567cb1b550d9ad78b3bf4.png"
                        },
                        "level": 8
                    },
                    "survived": false,
                    "name": "Submarine_M1",
                    "vehicle_id": 3552458448,
                    "nickname": "Submarine_M1"
                },
                {
                    "clan_id": 1000045051,
                    "result_id": 14980389,
                    "spa_id": 1007402514,
                    "ship": {
                        "name": "Loyang B",
                        "icons": {
                            "dead": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_dead/PZSD598_ee528c7282a01de95ae46703e82d06cf96c2b2a51563e8940043df6f04219334.png",
                            "alive": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_alive/PZSD598_b0b8e4086b8d12c84a24d3000eb24cc4ef96d1987e587154574ec2486874d03b.png"
                        },
                        "level": 8
                    },
                    "survived": false,
                    "name": "Drahclam",
                    "vehicle_id": 3667801296,
                    "nickname": "Drahclam"
                },
                {
                    "clan_id": 1000045051,
                    "result_id": 14980389,
                    "spa_id": 1011582550,
                    "ship": {
                        "name": "Cossack B",
                        "icons": {
                            "dead": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_dead/PBSD598_62e615cc05eff110fc867f2c09d61729daf0c9c569e15be1ea460895d59eb673.png",
                            "alive": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_alive/PBSD598_6630c68129b8929632c0eca0b4a4497b879c68ff0a8539137cb32021a94b8065.png"
                        },
                        "level": 8
                    },
                    "survived": false,
                    "name": "Brain_Clamage",
                    "vehicle_id": 3667802064,
                    "nickname": "Brain_Clamage"
                },
                {
                    "clan_id": 1000045051,
                    "result_id": 14980389,
                    "spa_id": 1049516891,
                    "ship": {
                        "name": "HSF Harekaze",
                        "icons": {
                            "dead": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_dead/PJSD708_5abdac3e0317d8739912c8bb8b315ed3ddeee11aabc71ba569f786f2eddeab15.png",
                            "alive": "//wows-gloss-icons.wgcdn.co/icons/vehicle/contour_alive/PJSD708_355e51c0c5738677e7bbed1f2bc85cf9617f5025ca7567cb1b550d9ad78b3bf4.png"
                        },
                        "level": 8
                    },
                    "survived": false,
                    "name": "RSRampage01",
                    "vehicle_id": 3552458448,
                    "nickname": "RSRampage01"
                }
            ],
            "id": 14980389,
            "team_number": 1,
            "rating_delta": -21,
            "stage": null
        }
    ],
        "map": {
        "name": "New Dawn"
    },
    "map_id": 6,
        "arena_id": 3497595458793613,
            "realm": "us",
                "season_number": 27,
                    "id": 7525030,
                        "cluster_id": 4307,
                            "finished_at": "2024-09-13T03:34:14+00:00"
},

*/
