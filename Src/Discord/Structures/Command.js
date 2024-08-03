/**
 * @typedef {Object} Validation
 * @property {function} callback - The condition to validate
 * @property {string} message - The message to be displayed if callback condition is not met
 */


/**
 * @typedef {Object} SubCommand
 * @property {string} trigger - subcommand invoke
 * @property {string} description - subcommand description
 */


/**
 * @typedef {"OWNER"|"ADMIN"|"MODERATION"|"TICKET"|"SUGGESTION"|"INFORMATION"|"ECONOMY"|"FUN"|"IMAGE"|"NONE"} CommandCategory
 */


/**
 * @typedef {Object} CommandData
 * @property {string} name - The name of the command (must be lowercase)
 * @property {boolean} enabled - Whether the command is enabled or not
 * @property {string[]} [aliases] - Alternative names for the command (all must be lowercase)
 * @property {string} description - A short description of the command
 * @property {string} [usage=""] - The command usage format string
 * @property {number} [minArgsCount=0] - Minimum number of arguments the command takes (default is 0)
 * @property {SubCommand[]} [subcommands=[]] - List of subcommands
 * @property {number} cooldown - The command cooldown in seconds
 * @property {CommandCategory} category - The category this command belongs to
 * @property {import('discord.js').PermissionResolvable[]} [botPermissions] - Permissions required by the client to use the command.
 * @property {import('discord.js').PermissionResolvable[]} [userPermissions] - Permissions required by the user to use the command
 * @property {Validation[]} [validations] - List of validations to be run before the command is executed
 * @property {CommandInfo} command - A short description of the command
 * @property {function(import('discord.js').Message, string[], object)} exe - The callback to be executed when the command is invoked
 */


/**
 * Placeholder for command data
 * @type {CommandData}
 */
module.exports = {
    name: "",
    aliases: [],
    description: "",
    usage: "",
    args: 0,
    subCommands: [],
    cooldown: 0,
    //isPremium: false,
    category: "NONE",
    //botPermissions: [],
    //userPermissions: [],
    //validations: [],
    exe: (message, args, data) => { },
};
