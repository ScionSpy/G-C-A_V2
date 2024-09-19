const { defineQuery } = require('../../Utils');
const WargamingAPI = require('../API');
const API = new WargamingAPI();

module.exports = {
    getShipData: async function getShipData(ship_id) {
        if (typeof ship_id !== "number" && typeof ship_id !== "string") throw new Error(`WargamingAPI.getShipData(ship_id); {ship_id} must be a number, or a string of numbers seperated by a coma!`);
        if (typeof ship_id === "string" && ship_id.includes(" ")) throw new Error(`WargamingAPI.getShipData(ship_id); {ship_id} must be a number, or a string of numbers seperated by a coma!`);
        if (typeof ship_id === "string" && !ship_id.includes(",") && isNaN(ship_id)) throw new Error(`WargamingAPI.getShipData(ship_id); {ship_id} must be a number, or a string of numbers seperated by a coma!`);

        let queryData = defineQuery(ship_id, 100);
        let ships = [];

        for (let x = 0; x < queryData.length; x++) {
            for (let y = 0; y < queryData[x].length; y++) {
                let q = queryData[x][y];
                //if (q.length < 3 || q.length > 24) throw new Error(`WargamingAPI.getShipData(ship_id = '${q}')\n  Queries must have a minimum character limit of 3, or a maximum count of 24!\n`);
            };

            let results = await API.makeAPICall('wows/encyclopedia/ships/', `ship_id=${queryData[x].join(',')}`);

            if (results.status === "error") throw new Error(`WargamingAPI.getShipData(query='${results.error.value}') -> ` + await API.handelApiError(results.error, 'encyclopedia/ships'));
            else ships = ships.concat(results.data);
        };
        
        return ships;
    },
};
