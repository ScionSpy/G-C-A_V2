module.exports = {
    DEBUG: {
        all: false, // Debugs incoming and outgoing packets. Regardless of 'in'/'out' settings.
        out: false, // Debugs all outgoing packets.
        in: false, // Debugs all incoming packets.
    },

    Wargaming: {
        Debug: false, // Debugs Wargaming API packets.
        URL: 'https://api.worldofwarships.com/',
        app_id: 'application_id=',
        clan_id: ''
    },
}
