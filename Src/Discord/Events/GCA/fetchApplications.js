const { MessageEmbed } = require('discord.js');
const { Clans, Players } = require('../../../WebAPI/Wargaming/index');
const roundTo = require('../../Helpers/Utils').roundToNthNumber;
const Util = require('../../../WebAPI/Utils');

/**
 *
 * @param {Number} value
 */
function getLength(value){
    return value.toString().length;
};

/**
 *
 * @param {Date} Date
 */
function getTimeStamp(Date){

    let Year = Date.getFullYear();
    let Month = Date.getMonth() +1;
    let Day = Date.getDate();
    let Hour = Date.getHours();
    let Minute = Date.getMinutes();
    let Second = Date.getSeconds();

    if (getLength(Month) == 1) Month = `0${Month}`;
    if (getLength(Day) == 1) Day = `0${Day}`;
    if (getLength(Hour) == 1) Hour = `0${Hour}`;
    if (getLength(Minute) == 1) Minute = `0${Minute}`;
    if (getLength(Second) == 1) Second = `0${Second}`;

    return `${Year}-${Month}-${Day} ${Hour}:${Minute}:${Second} EST`;
};


/** @param {import('../../Structures/BotClient')} bot */
module.exports = async function (bot) {
    let applications = await bot.Clan.applications.getApplications();

    if(applications.length == 0) return;
    let dbApps = await bot.DB._Get("Applications", {}, {id:1, expires_at:1});
    let dbAppsList = [];

    for (let x = 0; x < dbApps.length; x++) {
        let dbApp = dbApps[x];
        dbAppsList.push(dbApp.id);
    };

    let players = [];

    for(let x = 0; x<applications.length; x++){
        let app = applications[x];

        if(dbAppsList.includes(app.id)) return;
        players.push(app.account.id);

        let appData = structuredClone(app);
        appData.expires_at = app.expires_at*1000
        bot.DB._Post("Applications", appData);
    };

    players = await Players.getDetails(players.join(','));

    /**
     * @typedef {Object} playerData
     * @property {Number} created_at
     */
    /** @type {Array<playerData>} */
    let playerData = {};

    for(let key in players[0]){
        let player = players[0][key];
        playerData[key] = {
            created_at: player.created_at *1000,
            last_battle: player.last_battle_time *1000
        };
    };

    let results = [];
    console.log(playerData)

    for(let x = 0; x<applications.length; x++){
        let app = applications[x];

        let oldMember = await bot.DB._Get("Members", {id:app.account.id});
        if(oldMember[0]) oldMember = true;

        let stats;
        app.is_hidden_statistics ?
        stats = "Hidden" :
        stats = {
            wr: app.statistics.wb,
            battles: app.statistics.btl,
        };

        results.push({
            id: app.id,
            name: app.account.name,
            comment: app.comment,
            inviteExpiresAt: app.expires_at,
            joined_at: playerData[app.account.id].created_at,
            cooldown_expires: app.account.in_clan_cooldown_till,
            last_battle: playerData[app.account.id].last_battle,
            oldMember,
            stats
        });
    };

    let embeds = [];
    for(let x = 0; x< results.length; x++){
        let result = results[x];
        console.log(result)

        let joinedAt = getTimeStamp(new Date(result.joined_at));
        let lastBattle = getTimeStamp(new Date(result.last_battle));
        let cooldown = getTimeStamp(new Date(result.cooldown_expires));
        let expiresAt = getTimeStamp(new Date(result.inviteExpiresAt));


        let embed = new MessageEmbed();
        embed.setAuthor(`${result.name} | App ID: ${result.id}`);
        embed.addField('Account', `\`\`\`js\n   Created : ${joinedAt}\nLastBattle : ${lastBattle}\n  Cooldown : ${cooldown}\`\`\``, true)

        if(result.stats === "Hidden") embed.addField('Statistics', `\`\`\`js\nProfile is Private\`\`\``)
        else embed.addField('Statistics', `\`\`\`js\nBattles : ${result.stats.battles}\nWinRate : ${roundTo(result.stats.wr, 2)}\nPer Day : ${roundTo(result.stats.battles/(result.joined_at/1000/60/60/24), 3)}\`\`\``, true);

        if(result.comment) embed.setDescription(`Application Message:\`\`\`\n${result.comment}\`\`\``)
        embed.setFooter(`App expires at: ${expiresAt}`)

        embeds.push(embed);
    };

    let embedSections = Util.limitArray(embeds, 10);

    for (let x = 0; x < embedSections.length;x++){

        bot.channels.cache.get('1222751535159578717').createWebhook(`New G-C-A Application${embeds.length>1?'s':''}!`, {avatar: bot.user.displayAvatarURL({dynamic: true}), reason:"Applications Detected"})
        .then(w => {
            w.send({
                embeds: embedSections[x]
            })
            .then(() => {
                w.delete("Applications Reported");
            })
        })
        .catch(err => {
            throw new Error(`bot.Event('fetchApplications'); -> ${err.stack}`);
        });
    };
};
