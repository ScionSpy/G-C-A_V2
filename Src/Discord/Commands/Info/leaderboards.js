const { MessageEmbed } = require("discord.js");
const { timeformat } = require("../../Helpers/Utils");


/**
 * @type {import("../../Structures/Command")}
 */
const cmd = {};
module.exports = cmd;
cmd.enabled = true;
cmd.name = "leaderboards";
cmd.aliases = ['lb', 'leaderboard', 'boards'];
cmd.category = "fun";
cmd.description = "Displays the servers leaderboards";
cmd.subcommands = [];


cmd.exe = async function (message, args) {
    // voice
    await getVoiceLeaderboards(message);
};


async function getVoiceLeaderboards(message){
    let leaderboards = await message.guild.settings.getVoiceLeaderBoard();
    let verified = await message.client.DB._Get("Verified");

    let board = [];
    for(let x = 0; x < leaderboards.top.length; x++){
        let user = leaderboards.top[x];
        let player = message.client.Players[message.client.PlayersIndex.get(user.user_id)];

        if (player) {
            player = player.name;

        } else {
            //If player does not have a cached player, check the verified users

            for (let y = 0; y < verified.length; y++) {
                if (user.user_id === verified[y].discord_id){
                    player = verified[y].name;
                    break;
                };
            };

            // If player is also not Verified, snag their server display name.
            if(!player){
                try{
                    let member = await message.guild.members.fetch(user.user_id);
                    player = member.displayName;
                    if(!player) player = member.user.username;

                }catch(err){
                    // Player not found on the server, check all of discord!

                    let user = await message.client.users.fetch(user.user_id);
                    player = user.username;
                };
            };
        };

        board.push({user: player, time: user.time});
    };


    let list = [];
    let longest = 0;
    for(let x = 0; x < board.length; x++){
        if (board[x].user.length > longest) longest = board[x].user.length;
    };

    let useShort = false;
    for (let x = 0; x < board.length; x++) {
        let player = board[x].user;
        if (player.length < longest) player = await player.padStart(longest, ' ');
        if (board[x].time > 86400) useShort = true;
        list.push(`${player} : ${timeformat(board[x].time, useShort)}`);
    };

    let embed = new MessageEmbed();
    embed.setTitle(`G-C-A Voice LeaderBoards - Top ${leaderboards.total >= 10 ? '10' : leaderboards.total} of ${leaderboards.total}`);
    embed.setColor("GREEN");
    embed.setTimestamp()
    embed.setFooter(message.client.user.username + ` by [G-C-A] ShadowSpyy`, message.client.user.avatarURL({dynamic:true}));
    embed.setDescription(`\`\`\`js\n${list.join('\n')}\`\`\``);

    return await message.channel.send(embed);
};
