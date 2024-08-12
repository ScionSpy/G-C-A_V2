const Util = {};
module.exports = Util;



Util.limitArray = function (array, arraySizeTo) {
    const arrayChunks = [];
    const arrayCopy = Array.from(array);

    while (arrayCopy.length > 0) {
        arrayChunks.push(arrayCopy.splice(0, arraySizeTo));
    };

    return arrayChunks;
};

Util.defineQuery = function (query, limit = 100) {
    if (query.includes(' ')) {
        query = query.replace(/, /g, ','); // Removes all seperator commas.
        query = query.replace(/ /g, '_'); // Changes all name "spaces" to underscores (Character names cannot have spaces.)
    };

    let queryArray = query.split(',');
    return Util.limitArray(queryArray, limit);
};
