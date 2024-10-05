const Chart = require('../../Structures/chart');
const { MessageEmbed } = require('discord.js');
const DB = require('../../../Database/index');
const Player = require('../../../Database/Schemas/Player/Player');
const Constants = require('../../../Constants');
let bot;


async function createChart(options = { labels: [], dataset: [] }, title, TITLE = `              G-C-A Activity\n{DATE_RANGE}`){
    if (typeof options !== "object") throw new Error(`Cmd.Activity.createChart(options = { labels: [], dataset: []}); {options} must be an object. got ${typeof object} : ${object}`);
    //if (typeof options.labels !== "object" || options.dataset !== "object") throw new Error(`Cmd.Activity.createChart(options = { labels: [], dataset: []}); {options.labels} and {options.dataset} must both be arrays. got ${typeof options.labels} & ${typeof options.dataset} : ${JSON.stringify(options)}`);
    if (options.labels.length <= 0 || options.dataset.length <= 0) throw new Error(`Cmd.Activity.createChart(options = { labels: [], dataset: []}); {options.lables} and {options.dataset} must both contain values!\n> {options.labels} must contain strings.\n> {options.dataset} must contain an array of Objects. {label: Str, data: [Int, int]}`);


    if (title) TITLE = TITLE.replace('{DATE_RANGE}', title);
    else TITLE = TITLE.replace('\n{DATE_RANGE}', '');

    const chart = new Chart({title:TITLE, type:"line"});

    for (let x = 0; x < options.labels.length;x++){
        chart.addLabel(options.labels[x]);
    };

    for (let x = 0; x < options.dataset.length; x++) {
        chart.addDataset(options.dataset[x]);
    };

    return await chart.save();
};

/**
 * @type {import("../../Structures/Command")}
 */
module.exports = {
    name: "activity",
    enabled: false,
    description: "Shows the Clan's activity coverage time.",
    category: "INFORMATION",
    subcommands: [{
        trigger: "user",
        description: "Allows a Staff member to pull player specific activity."
    }],

    async exe(message, args) {
        bot = message.client;

        let activity;
        let limit = 48;

        console.log(args)
        if(args.length == 1){
            let sub = args.shift();
            if(!isNaN(sub)) limit = sub;
            else activity = await this.getPlayer(message.author.player, sub);
        } else if (args.length > 1){
            let sub;
            if(!isNaN(args[0])) limit = args.shift();
            else sub = args.shift();

            if (isNaN(args[0])) sub = args.shift();
            else limit = args.shift();

            activity = await this.getPlayer(message.author.player, sub, Number(limit));
        };

        if (!activity) activity = await this.getClanActivity(Number(limit));


        if(!activity) return message.reply(`there was an error pulling activity!`);
        let embed = new MessageEmbed();
        embed.setTitle(`Activity Chart\n${activity.totalBattles} battles in the last ${activity.limit} hours.`);
        embed.setImage(activity.chart);
        embed.setTimestamp();
        embed.setFooter(message.client.user.tag, message.client.user.avatarURL({dynamic: true}));

        message.channel.send(embed);
    },


    async getActivityData(limit = 48, playerID) {
        if ((typeof limit !== "number" && typeof limit !== "undefined") || limit < 0) throw new Error(`Cmd.Activity.getPlayerActivity(limit, playerID); {limit} must be a number over 0. got ${typeof limit} : ${limit}`);
        if (typeof playerID !== "undefined" && typeof playerID !== "number") throw new Error(`Cmd.Activity.getPlayerActivity(limit, playerID); {playerID} must be undefined or a number. got ${typeof playerID} : ${JSON.stringify(playerID) }`);

        let dbOptions = {};
        dbOptions.sort = { date: -1 };
        if (limit) dbOptions.limit = limit;

        let proj = null;
        if(playerID){
            proj = {};
            proj['date'] = 1;
            proj[`members.${playerID}`] = 1;
        };

        let activity = await DB._Get("Activity", {}, proj, dbOptions);
        activity = activity.reverse();

        return activity;
    },


    async getPlayer(author, sub, limit){
        if(!author || (author.name !== sub && !author.isRecruiter())) return;
        return await this.getPlayerActivity(limit, sub);
    },


    /**
     *
     * @param {Number} limit
     * @param {import('../../../Database/Schemas/index').Players.Player} player
     * @returns
     */
    async getPlayerActivity(limit = 48, playerName) {
        if ((typeof limit !== "number" && typeof limit !== "undefined") || limit < 0) throw new Error(`Cmd.Activity.getPlayerActivity(limit, player); {limit} must be a number over 0. got ${typeof limit} : ${limit}`);
        if ((typeof playerName !== "string")) throw new Error(`Cmd.Activity.getPlayerActivity(limit, playerName); {playerName} must be a string. got ${typeof playerName} : ${playerName}`);


        let player = bot.Players[bot.PlayersIndex.get(playerName)];
        if (!player) player = bot.Players[bot.PlayersIndex.get(playerName.toLowerCase())];
        if (!player) return;


        let activity = await this.getActivityData(limit, player.id);

        let hours = [];
        let Dataset = [
            {
                label: "Battles",
                data: [],
                color: "#00a950",
                fill: false,
                //lineTension:0.2,
                //backgroundColor: "#FFFFFF"
            }
        ];

        let totalBattles = 0;
        for (let x = 0; x < activity.length; x++) {
            let activityData = activity[x];
            if (activityData.date == "ACTIVITY_CONTROL") continue;

            let date = activityData.date.split('_');
            date[0] = date[0].split("-");
            let _Date = new Date();
            _Date.setUTCMonth(date[0][1])
            _Date.setUTCDate(date[0][2])
            _Date.setUTCHours(date[1]);

            hours.push(`${_Date.getMonth()}-${_Date.getDate()}_${_Date.getHours()}:00`);

            let battles = 0;

            for (let playerID in activityData.members) {
                try {
                    playerID = Number(playerID);
                    if(playerID !== player.id) continue;
                    battles += activityData.members[playerID].length;

                } catch (err) {
                    throw new Error(`Cmd.Activity.getPlayerActivity(); playerID = ${playerID}\n\n  ${err}`);
                };
            };

            totalBattles += battles;
            Dataset[0].data.push(battles);
        };

        let TIME = `{RANGE1} - {RANGE2}`;
        if (activity[0].date === "ACTIVITY_CONTROL") TIME = TIME.replace('{RANGE1}', activity[1].date);
        else TIME = TIME.replace('{RANGE1}', activity[1].date);

        if (activity[activity.length - 1].date === "ACTIVITY_CONTROL") TIME = TIME.replace('{RANGE2}', activity[activity.length - 2].date);
        else TIME = TIME.replace('{RANGE2}', activity[activity.length - 1].date);

        return { limit, totalBattles, chart: await createChart({ labels: hours, dataset: Dataset }, TIME, `${bot.Ranks[bot.RanksIndex.get(player.clan.rank)].short} ${player.name}\n{DATE_RANGE}`) };
    },

    async getClanActivity(limit = 48){
        if ((typeof limit !== "number" && typeof limit !== "undefined") || limit < 0) throw new Error(`Cmd.Activity.getClanActivity(limit); {limit} must be a number over 0. got ${typeof limit} : ${limit}`);

        let activity = await this.getActivityData(limit);

        let hours = [];
        let Dataset = [
            {
                label: "Commander",
                data: [],
                color: "#858585",
                fill: false,
                //lineTension:0.2,
                //backgroundColor: "#FFFFFF"
            },
            {
                label: "XO",
                data: [],
                color: "#3F9FDF",
                fill: false,
                //lineTension:0.2,
                //backgroundColor: "#FFFFFF"
            },
            {
                label: "Recruiters",
                data: [],
                color: "#FF0000",
                fill: false,
                //lineTension:0.2,
                //backgroundColor: "#FFFFFF"
            },
            {
                label: "Officers",
                data: [],
                color: "#FFA500",
                fill: false,
                //lineTension:0.2,
                //backgroundColor: "#FFFFFF"
            },
            {
                label: "Members",
                data: [],
                color: "#00a950",
                fill: false,
                //lineTension:0.2,
                //backgroundColor: "#FFFFFF"
            },
        ];

        let totalBattles = 0;

        for(let x = 0; x < activity.length; x++){
            let activityData = activity[x];
            if(activityData.date == "ACTIVITY_CONTROL") continue;

            let date = activityData.date.split('_');
            date[0] = date[0].split("-");
            let _Date = new Date();
            _Date.setUTCMonth(date[0][1])
            _Date.setUTCDate(date[0][2])
            _Date.setUTCHours(date[1]);

            hours.push(`${_Date.getMonth()}-${_Date.getDate()}_${_Date.getHours()}:00`);

            let battles = {
                members: 0,
                officers: 0,
                recruiters: 0,
                executives: 0,
                commander: 0,
            };

            for(let playerID in activityData.members){
                try{
                    playerID = Number(playerID);
                    if(!bot.Players[bot.PlayersIndex.get(playerID)]) continue;

                    totalBattles += activityData.members[playerID].length;

                    if (bot.Players[bot.PlayersIndex.get(playerID)].isNonComissioned()) battles.members += activityData.members[playerID].length;
                    else{
                        battles.officers += activityData.members[playerID].length;

                        if (bot.Players[bot.PlayersIndex.get(playerID)].isRecruiter(true)) battles.recruiters += activityData.members[playerID].length;
                        else if (bot.Players[bot.PlayersIndex.get(playerID)].isXO(true)) battles.executives += activityData.members[playerID].length;
                        else if (bot.Players[bot.PlayersIndex.get(playerID)].isCO(true)) battles.commander += activityData.members[playerID].length;
                    };

                } catch (err) {
                    throw new Error(`Cmd.Activity.getClanActivity(); playerID = ${playerID}\n\n  ${err}`);
                };
            };


            Dataset[0].data.push(battles.commander);
            Dataset[1].data.push(battles.executives);
            Dataset[2].data.push(battles.recruiters);
            Dataset[3].data.push(battles.officers);
            Dataset[4].data.push(battles.members);
        };

        let TIME = `{RANGE1} - {RANGE2}`;
        if (activity[0].date === "ACTIVITY_CONTROL") TIME = TIME.replace('{RANGE1}', activity[1].date);
        else TIME = TIME.replace('{RANGE1}', activity[1].date);

        if (activity[activity.length - 1].date === "ACTIVITY_CONTROL") TIME = TIME.replace('{RANGE2}', activity[activity.length - 2].date);
        else TIME = TIME.replace('{RANGE2}', activity[activity.length - 1].date);

        return { limit, totalBattles, chart: await createChart({ labels: hours, dataset: Dataset }, TIME)};
    },
};
