module.exports = {
    DEBUG: {
        all: false, // Debugs incoming and outgoing packets. Regardless of 'in'/'out' settings.
        out: false, // Debugs all outgoing packets.
        in: false, // Debugs all incoming packets.
    },

    Wargaming: {
        Debug: false, // Debugs Wargaming API packets.
        URL: 'https://api.worldofwarships.com/wows/',
        app_id: 'application_id=eec4c249227db89c659d027b9b7b4d36',
        clan_id: '1000101905'
    },
}
