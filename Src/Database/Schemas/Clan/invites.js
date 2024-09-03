const { Clans } = require('../../../WebAPI/Wargaming/index.js');

module.exports = invites = {
    async getInvites() {
        let clanInvites = await Clans.getInvites({ getAll: true });
        return clanInvites;
    },


    /**
     *
     * @param {Object} data
     * @param {String} data.name Player Name
     * @param {Number} data.id Player account ID
     */
    async getInviteFor(data) {
        if (!data || typeof data !== "object") throw new Error(`Clan.getInviteFor(data); 'data' must be defined and an object. got ${typeof data}`);
        if (!data.name && !data.id) throw new Error(`Clan.getInvitesFor(data); 'data' must have one of either 'data.name' as a String or 'data.id' as a Number. Got ${JSON.stringify(data, null, 4)}.`);
        if (data.name && typeof data.name !== "string") throw new Error(`Clan.getInviteFor(data); 'data.name' must be a string! Got ${typeof data.name}`);
        if (data.id && typeof data.name !== "number") throw new Error(`Clan.getInviteFor(data); 'data.id' must be a Number! got ${typeof data.id}`);

        let inviteData;

        let clanInvites = await this.getInvites();
        for (let x = 0; x < clanInvites.length; x++) {
            let invite = clanInvites[x];

            if (data.name && invite.account.name === data.name) inviteData = invite;
            else if (data.id && invite.account.id === data.id) inviteData = invite;

            if (inviteData) break;
        };

        return inviteData;
    },
}
