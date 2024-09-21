const { Clans, Players } = require('../../../WebAPI/Wargaming/index.js');
const clan_id = require('../../../Constants.js').GCA.id;
const DB = require('../../../Database/index.js');
const Utils = require('../../Helpers/Utils.js');

module.exports = async function(bot){try{
    console.log(`\nStart Event.fetchLastBattles()`);
    let GCA = await Clans.getDetails(clan_id);
    GCA = GCA[0][clan_id];

    let MemberStats = await Players.getDetails(GCA.members_ids.join(","));
    if (MemberStats.length == 0) console.log(`(${Date.now}) Event.fetchLastBattles(); Error, MemberStats from Players.getDetails().makeApiCall('account/info') is empty!`);
    let Members = await DB._Get("Members", {active:true});

    let lastBattleTimes = {};

    // Only handle members "Already" in the clan.
    for(let x = 0; x < Members.length; x++){
        let member = MemberStats[0][Members[x].id.toString()];
        if(member){
            lastBattleTimes[Members[x].id] = member.last_battle_time;
        }else {
            // Member left the clan....
        };
    };

    let date = Utils.getTimeStamp({Date:new Date(), UTC:true});
    console.log(`> Event.fetchLastBattles:date_1 = `+date);
    date = date.split(" ");
    let utcHour = date[1].split(":")[0];
    date = date[0];
    let DATE = `${date}_${utcHour}`;
    console.log(`> Event.fetchLastBattles:DATE = ` + DATE);



    let Activity = await DB._Get("Activity");
    let activityLength = Activity.length;
    let ActivityControl;

    if(!Activity){
        Activity = { date: `${date}_${utcHour}`, members: {} };
        ActivityControl = { date: `ACTIVITY_CONTROL`, members: {} };

    } else if (Activity.length == 1) {
        ActivityControl = Activity.shift();
        Activity = { date: `${date}_${utcHour}`, members: {} };
    } else {
        ActivityControl = Activity.shift();
        Activity = Activity.pop();

        if (Activity.date !== DATE){
            console.log(`> Event.fetchLastBattles: (Activity.date !== DATE) Creating blank entry!`);
            Activity = { date: `${date}_${utcHour}`, members: {} };
        };
    };


    for (let key in lastBattleTimes){
        let last_battle = lastBattleTimes[key];

        if (!ActivityControl.members[key]) ActivityControl.members[key] = [];

        if(ActivityControl.members[key][ActivityControl.members[key].length -1] !== last_battle){
            ActivityControl.members[key].push(last_battle);
            if (!Activity.members[key]){
                Activity.members[key] = [];
                Activity.members[key].push(last_battle);

            } else {
                Activity.members[key].push(last_battle);
            };
        };
    };


    console.log(`> Event.fetchLastBattles:date_2 = ` + date);
    console.log(`> Event.fetchLastBattles:Activity.date = ` + Activity.date);

    await DB._Edit("Activity", {date: "ACTIVITY_CONTROL"}, ActivityControl);
    await DB._Edit("Activity", { date: DATE }, Activity);


    console.log(`End Event.fetchLastBattles()`);

    if (!activityLength){ // First-time start-up.
        await DB._Delete("Activity", { date: DATE });
        console.log(`Re-Executing 'FetchLastBattles' event for first run completion.`);
        bot.emit('fetchLastBattles', bot);
    };
}catch(err){
    console.error(`Error executing Event.fetchLastBattles()`, err);
};
};
