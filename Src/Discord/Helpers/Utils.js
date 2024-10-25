const { readdirSync, lstatSync } = require("fs");
const { join, extname } = require("path");

module.exports = class Utils {

    /**
     * Checks if a string contains a URL
     * @param {string} text
     */
    static containsLink(text) {
        return /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/.test(
            text
        );
    };

    /**
     * Checks if a string is a valid discord invite
     * @param {string} text
     */
    static containsDiscordInvite(text) {
        return /(https?:\/\/)?(www.)?(discord.(gg|io|me|li|link|plus)|discorda?p?p?.com\/invite|invite.gg|dsc.gg|urlcord.cf)\/[^\s/]+?(?=\b)/.test(
            text
        );
    };

    /**
     * Returns a random number below a max
     * @param {number} max
     */
    static getRandomInt(max) {
        return Math.floor(Math.random() * max);
    };

    /**
     * Returns remaining time in days, hours, minutes and seconds
     * @param {number} timeInSeconds
     */
    static timeformat(timeInSeconds, short) {
        const days = Math.floor((timeInSeconds % 31536000) / 86400);
        const hours = Math.floor((timeInSeconds % 86400) / 3600);
        const minutes = Math.floor((timeInSeconds % 3600) / 60);
        const seconds = Math.round(timeInSeconds % 60);
        if(short) return (
            (days > 0 ? `${days < 10 ? `•${days}` : days} days, ` :  short ? `•• days, ` : '') +
            (hours > 0 ? `${hours < 10 ? `•${hours}` : hours} hrs, ` : `•• hrs, `) +
            (minutes > 0 ? `${minutes < 10 ? `•${minutes}` : minutes} mins, ` : `•• mins, `) +
            (seconds > 0 ? `${seconds < 10 ? `•${seconds}` : seconds} secs` : `•• secs`)
        );
        else return (
            (days > 0 ? `${days < 10 ? `•${days}` : days} days, ` : short ? `•• days, ` : '') +
            (hours > 0 ? `${hours < 10 ? `•${hours}` : hours} hours, ` : `•• hours, `) +
            (minutes > 0 ? `${minutes < 10 ? `•${minutes}` : minutes} minutes, ` : `•• minutes, `) +
            (seconds > 0 ? `${seconds < 10 ? `•${seconds}` : seconds} seconds` : `•• seconds`)
        );
    }

    /**
     * @param {import("discord.js").PermissionResolvable[]} perms
     */
    static parsePermissions(perms) {
        const permissionWord = `permission${perms.length > 1 ? "s" : ""}`;
        return "`" + perms.map((perm) => permissions[perm]).join(", ") + "` " + permissionWord;
    }

    /**
     * Recursively searches for a file in a directory
     * @param {string} dir
     * @param {string[]} allowedExtensions
     */
    static recursiveReadDirSync(dir, allowedExtensions = [".js"]) {
        const filePaths = [];
        const readCommands = (dir) => {
            const files = readdirSync(join(process.cwd(), dir));
            files.forEach((file) => {
                const stat = lstatSync(join(process.cwd(), dir, file));
                if (stat.isDirectory()) {
                    readCommands(join(dir, file));
                } else {
                    const extension = extname(file);
                    if (!allowedExtensions.includes(extension)) return;
                    const filePath = join(process.cwd(), dir, file);
                    filePaths.push(filePath);
                }
            });
        };
        readCommands(dir);
        return filePaths;
    };


    static roundToNthNumber(value, roundTo){
        return Number(value.toFixed(roundTo));
    };


    /**
     * @param {Object} options
     * @param {Date} options.Date
     * @param {Boolean} options.UTC Set timestamp as UTC.
     */
    static getTimeStamp(options = {Date: new Date(), UTC: false}) {
        if(options.UTC && typeof options.UTC !== "boolean") throw new Error(`Utils.getTimeStamp(options = {Date, UTC}); {options.UTC} if provided Must be a Boolean! got ${typeof options.UTC} : ${options.UTC}`);

        /**
         *
         * @param {Number} value
         */
        function getLength(value) {
            return value.toString().length;
        };

        let date = options.Date// ? options.Date : new Date();
        if(!date) date = new Date();

        let Year;
        let Month;
        let Day;
        let Hour;
        let Minute;
        let Second;

        if(!options.UTC){
            Year = date.getFullYear();
            Month = date.getMonth() + 1;
            Day = date.getDate();
            Hour = date.getHours();
            Minute = date.getMinutes();
            Second = date.getSeconds();

        } else {
            Year = date.getUTCFullYear();
            Month = date.getUTCMonth() + 1;
            Day = date.getUTCDate();
            Hour = date.getUTCHours();
            Minute = date.getUTCMinutes();
            Second = date.getUTCSeconds();
        };


        if (getLength(Month) == 1) Month = `0${Month}`;
        if (getLength(Day) == 1) Day = `0${Day}`;
        if (getLength(Hour) == 1) Hour = `0${Hour}`;
        if (getLength(Minute) == 1) Minute = `0${Minute}`;
        if (getLength(Second) == 1) Second = `0${Second}`;
        return `${Year}-${Month}-${Day} ${Hour}:${Minute}:${Second} ${options.UTC ? 'UTC' : 'EST'}`;
    };
};
