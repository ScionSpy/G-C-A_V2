require('dotenv').config();

const { BotClient } = require("./Discord/Structures");

// register extenders
require("./Discord/Helpers/Extenders/Guild");


// initialize client
const client = new BotClient();
client.loadCommands("./src/Discord/Commands");
client.loadEvents("./src/Discord/Events/Discord");
client.loadGCAEvents("./src/Discord/Events/GCA");



// find unhandled promise rejections
process.on("unhandledRejection", (err) => console.error(`Unhandled exception`, err));


(async () => {
    // start the dashboard
    /*if (client.config.DASHBOARD.enabled) {
        client.logger.log("Launching dashboard");
        try {
            const { launch } = require("@root/dashboard/app");

            // let the dashboard initialize the database
            await launch(client);
        } catch (ex) {
            console.error("Failed to launch dashboard", ex);
        }
    } else {
        // initialize the database
        await initializeMongoose();
    }*/

    // start the client
    await client.login(process.env.DISCORD_TOKEN);
})();
