module.exports = {
    Clans: {
        Clan: require('./Clan/_Clan'),
        applications: require('./Clan/applications'),
    },
    Players: {
        Player: require('./Player/Player'),
        DiscordPlayer: require('./Player/DiscordPlayer'),
    }
};
