const { Clans } = require('../../../WebAPI/Wargaming/index.js');



module.exports = ClanApplications = {

    async getApplications() {
        let applications = await Clans.getApplications();
        return applications;
    },

    /**
     *
     * @param {Object} data
     * @param {Number} data.id ID of the application, 7 digit number.
     * @param {String} data.status Status to mark this Application as.
     * * Accepts: "accepted" | "declined"
     * @returns
     */
    async __ApplicationResponse(data) {
        if (!data || typeof data !== "object") throw new Error(`API.Clans.acceptApplication('data'); {data} must be defined and an object! { id:int, status:str }`);
        if (!data.id || typeof data.id !== "number" || data.id.toString().length !== 7) throw new Error(`API.Clans.acceptApplication('data'); {data.id} must be a number and 7 characters long.`);
        if (!data.status || typeof data.status !== "string") throw new Error(`API.Clans.acceptApplication('data'); {data.status} must be defined as a string! got ${typeof data.status} : ${data.status}`);
        if (data.status !== "accepted" && data.status !== "declined") throw new Error(`API.Clans.acceptApplication('data'); {data.status} must be one of 'accepted' or 'declined'! got ${data.status}`);

        let results = await Clans.sendApplicationResponse({ id: data.id, status: data.status });
        return results;
    },

    async acceptApplication(id = undefined) {
        let result = await this.__ApplicationResponse({ id, status: "accepted" });
        if (result.type) return result;
        else return { status: 'accepted', result };
    },

    async declineApplication(id = undefined) {
        let result = await this.__ApplicationResponse({ id, status: "declined" });
        if (result.type) return result;
        else return { status: 'declined', result };
    },
};
