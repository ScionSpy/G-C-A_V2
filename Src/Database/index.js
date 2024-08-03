const Web = require('../WebAPI/Requests.js');
const Database = require('./core.js');
const DB = new Database();
module.exports = db = {};


//#region Core Functions.
db._Get = async function (table, data, proj, opt) {
    let res = await DB._Get(table, data, proj, opt);
    return res;
};

db._Post = async function (table, data) {
    let res = await DB._Post(table, data);
    return res;
};

db._Edit = async function (table, query, newData) {
    let res = await DB._Edit(table, query, newData);
    return res;
};

db._Delete = async function (table, data) {
    let res = await DB._Delete(table, data);
    return res;
};
//#endregion
