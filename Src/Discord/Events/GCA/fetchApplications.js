const { MessageEmbed } = require('discord.js');
const { Clans, Players } = require('../../../WebAPI/Wargaming/index');
const { Utils } = require('../../Helpers');
const Util = require('../../../WebAPI/Utils');

/** @param {import('../../Structures/BotClient')} bot */
module.exports = async function (bot) {
    let applications = await bot.Clan.getApplications();

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

    for(let key in players){
        let player = players[key];
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
            name: app.account.name,
            comment: app.comment,
            inviteExpiresAt: app.expires_at,
            joined_at: playerData[app.account.id].created_at,
            last_battle: playerData[app.account.id].last_battle,
            oldMember,
            stats
        });
    };

    let embeds = [];
    for(let x = 0; x< results.length; x++){
        let result = results[x];
        console.log(result)

        let embed = new MessageEmbed();
        embed.setAuthor(result.name);
        embed.addField('Account', `\`\`\`js\nCreated : ${new Date(result.joined_at)}\n LogOut : ${new Date(result.last_battle)}${previous}\`\`\``, true)

        if(result.stats === "Hidden") embed.addField('Statistics', `\`\`\`js\nProfile is Private\`\`\``)
        else embed.addField('Statistics', `\`\`\`js\nBattles : ${result.stats.battles}\nWinRate : ${result.stats.wr}\nPer Day : ${result.stats.battles/(result.joined_at/60/60/24)}\`\`\``, true);

        if(result.comment) embed.setDescription(`Application Message:\`\`\`\n${result.comment}\`\`\``)
        embed.setFooter(`App expires at: ${new Date(result.inviteExpiresAt)}`)

        embeds.push(embed);
    };

    let embedSections = Util.limitArray(embeds, 10);

    for (let x = 0; x < embedSections.length;x++){

        bot.channels.cache.get('1137246476188274750').createWebhook(bot.user.username, {avatar: bot.user.displayAvatarURL({dynamic: true}), reason:"Applications Detected"})
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
