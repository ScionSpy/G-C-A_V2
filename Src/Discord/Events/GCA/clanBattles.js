const ClanBattles = require('../../../Modules/ClanBattles/index');
const Chart = require('../../Structures/chart');
const Season = require('../../../Modules/ClanBattles/config').Season;



module.exports = async function (_, bot, type) {
    if (!type){
        //console.log(`Event: GCA_clanBattles !type.`);
        if (bot == 'callToArms' || 'callToArms_extra' || 'results') {
            //console.log(`Event: GCA_clanBattles !type (${type}). bot == '${bot}', setting type to bot.`);
            type = bot;
            bot = _;
        };
    }

    if (type == 'callToArms') return callToArms(bot);
    else if (type == 'callToArms_extra') return callToArms_Extra(bot);
    else if (type === "results") return battleResults(bot);
};


async function callToArms(bot) {
    let ch_clanBattles = await bot.channels.cache.get('1152409627795922944'); //#clan-battles-lobby

    ch_clanBattles.send(`<@&1126377465741324435>, <@&1126377465741324434>\n> :crossed_swords: Clan Battles start in 30 Minutes! :crossed_swords: \n\n Remember **do NOT Ready** if you're going to be in the armoury!!\n You WILL get stuck on the laoding screen!!`);

    //TODO: Make another call requesting {x} members at 7:30
    setTimeout(async function(){
        callToArms_Extra(bot);
    }, 1000 *60 *25);
};

async function callToArms_Extra(bot) {
    let ch_clanBattles = await bot.channels.cache.get('1152409627795922944'); //#clan-battles-lobby

    let ch_ReadyLounge = await bot.channels.cache.get('1126377466647294017'); //#Ready-Lounge
    let ch_divOne = await bot.channels.cache.get('1126377466647294018'); //#divison 1
    let ch_divTwo = await bot.channels.cache.get('1126377466647294019'); //#diviion 2

    if (
        ch_ReadyLounge.members.size >= 7 || ch_divOne.members.size >= 7 || ch_divTwo.members.size >= 7
    ) return console.log(`Event: GCA_clanBattles.callToArms(); Event Fired, but there was already a full team in VC.`);

    ch_clanBattles.send(`<@&1126377465741324435>, <@&1126377465741324434>\n> :crossed_swords: Clan Battles start in 5 Minutes! :crossed_swords:\n  We still need ${7 - ch_ReadyLounge.members.size} members to start a division!\n*Tʜɪs ᴛᴇxᴛ ɪs ᴏɴʟʏ ᴛʀᴀᴄᴋɪɴɢ "Rᴇᴀᴅʏ Lᴏᴜɴɢᴇ" ᴅɪsʀᴇɢᴀʀᴅ ɪғ ᴛʜᴇʀᴇ's ᴀ ғᴜʟʟ ᴅɪᴠɪsɪᴏɴ sᴇᴛ-ᴜᴘ ᴀʟʀᴇᴀᴅʏ!*`);
};


let results = [{ name: "wins", wins: 0 }, { name: "losses", losses: 0 }];
function resultsHas(title) {
    for (let x = 0; x < results.length; x++) {
        let key = results[x];
        if (key.name === title) return x;
    };
    return false;
};


async function formResults(stats, div){

    for (let x = 0; x < div.length; x++) {
        let key = div[x];
        if (key.name == "wins"){
            results[0].wins += stats.wins;
            continue;
        }else if (key.name == "losses"){
            results[1].losses += stats.losses;
            continue;
        };

        let index = resultsHas(key.name);
        if (!results[index]) {
            results.push({ name: key.name, wins: 0, losses: 0 });
            index = results.length - 1;
        };
        results[index].wins += key.wins;
        results[index].losses += key.losses;
    };

    return results;
};



async function battleResults(bot){
let CB_REVIEW_DUTAION = Date.now();
    let alpha = await ClanBattles.fetchBattles(1);
    let bravo = await ClanBattles.fetchBattles(2);
let CB_COLLECTED_AT_DUTAION = Date.now();
    let ch = bot.channels.cache.get('1152409627795922944'); //#clan-battles-lobby // 1152409627795922944 = cb-results ; //1137246476188274750 = 'shadow-spam
    let graphs = [];
    let stats = {};

    if (alpha.Embeds.length > 0) {
        for (let x = 0; x < alpha.Embeds.length; x++) {
            await ch.send(alpha.Embeds[x]);
        };
        stats.alpha = {
            wins: alpha.results[alpha.results.length - 2].wins,
            losses: alpha.results[alpha.results.length - 1].losses,
        };
        await ch.send(`Tonights Stats; Alpha Div:\`\`\`js\n\ \ Wins : ${stats.alpha.wins}\nLosses : ${stats.alpha.losses}\`\`\``);
        graphs.alpha = await createResultsChart(alpha.results, 'Alpha');
        await ch.send(graphs.alpha);
    };

    if (bravo.Embeds.length > 0) {
        for (let x = 0; x < bravo.Embeds.length; x++) {
            await ch.send(bravo.Embeds[x]);
        };
        stats.bravo = {
            wins: bravo.results[bravo.results.length - 2].wins,
            losses: bravo.results[bravo.results.length - 1].losses,
        };
        await ch.send(`Tonights Stats; Bravo Div:\`\`\`js\n\ \ Wins : ${stats.bravo.wins}\nLosses : ${stats.bravo.losses}\`\`\``);
        graphs.bravo = await createResultsChart(bravo.results, 'Bravo');
        await ch.send(graphs.bravo);
    };

    if(alpha.Embeds.length > 0 && bravo.Embeds.length > 0){
        await ch.send(`Tonights Stats; Alpha and Bravo Divs:\`\`\`js\n\ \ Wins : ${stats.alpha.wins + stats.bravo.wins}\nLosses : ${stats.alpha.losses + stats.bravo.losses}\`\`\``);

        if(results.length > 2) results = [{ name: "wins", wins: 0 }, { name: "losses", losses: 0 }];

        await formResults(stats.alpha, alpha.results);
        await formResults(stats.bravo, bravo.results);

        await ch.send(await createResultsChart(results, 'Alpha and Bravo'));

        //ch.send(`[CB_REVIEW_DURATION]:\n> Post tooke \`${CB_COLLECTED_AT_DUTAION - CB_REVIEW_DUTAION}\`ms to generate.\n> Post took \`${Date.now() - CB_REVIEW_DUTAION}\`ms to post to discord.`);
    };
};


/**
 *
 * @param {Object} results Team battle results.
 * @param {Number} results.wins Wins for the night.
 * @param {Number} results.losses losses for the night.
 * @param {String} div
 */
async function createResultsChart(results, div){
    let date = new Date();
    let MONTH = date.getMonth()+1; if(MONTH<10) MONTH = `0${MONTH}`;
    let DAY = date.getDate() + 1; if (DAY < 10) DAY = `0${DAY}`;

    let chart = new Chart({ type: "bar", title: `${div} Div's Results\nSeason ${Season.number}: ${Season.name} | ${date.getFullYear()}-${MONTH}-${DAY}`});

    //chart.addLabel(`Overall`);
    for (let x = 0; x < results.length; x++) {
        let key = results[x];
        if(key.name != "wins" && key.name != "losses") chart.addLabel(`[${key.name}]`);
    };

    //chart.addDataset({ label: "Wins", color: "#16A067", });
    //chart.addDataset({ label: "Losses", color: "#FF0000", });
    chart.addDataset({ label: "Overall", color: "#01ACFF", type: "line", linetension: 0, fill: false });
    chart.addDataset({ label: "Stats", color: "#16A067"});

    //chart.Datasets[0].data.push(results.wins);
    //chart.Datasets[1].data.push(results.losses);

    let wins = 0;
    let minMax = { min:0, max:0 };
    for (let x = 0; x<results.length; x++) {
        let key = results[x];
        if (key.name != "wins" && key.name != "losses"){
            /*chart.Datasets[0].data.push(results[key].wins);
            chart.Datasets[1].data.push(results[key].losses);
            wins += results[key].wins;
            wins -= results[key].losses;
            chart.Datasets[2].data.push(wins);*/

            chart.Datasets[1].data.push(key.wins - key.losses);

            wins += key.wins;
            wins -= key.losses;
            chart.Datasets[0].data.push(wins);

            if (wins > minMax.max) minMax.max = wins;
            if (wins < minMax.min) minMax.min = wins
        };
    };

    if (Math.abs(minMax.min) > Math.abs(minMax.max)) minMax = minMax.min;
    else minMax = minMax.max;

    return await chart.save({
        scales: { yAxes: [{ ticks: { min: minMax - minMax*2, max: minMax } }] },
    });

};
