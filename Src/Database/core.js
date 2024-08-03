const mongo = require('mongodb').MongoClient;
let MongoDB_URI = process.env.DATABASE_URI
    .replace('{USERNAME}', process.env.DATABASE_USERNAME)
    .replace('{PASSWORD}', process.env.DATABASE_PASSWORD)
    .replace('{TABLE}', process.env.DATABASE_TABLE);


const DEBUG = false;


print = function(txt){
    if (DEBUG) console.log(txt);
};

module.exports = class Database {
    /**
     * Used to determine the state of the MongoDB Process.
     * If the Process is offline or "stopped" this will prevent the bot from continually making Get/Post/Edit/Delete requests to the Database server.
     * The bot will operate in "Offline" mode.
     * * In "Offline" mode, no information is saved on the database, nor is it modified.
     * @property {Boolean} ConnectionFailed State of the MongoDB Service.
     */
    ConnectionFailed = false;

    collectionPrefix = "beta_";

    constructor(DB = null, prefix){
        if(DB){
            MongoDB_URI = process.env.DATABASE_URI
                .replace('{USERNAME}', DB.username)
                .replace('{PASSWORD}', DB.password)
                .replace('{TABLE}', DB.table);
        };
    };


    /*HandelMethod = async function(Method, Collection, Data, Extra){
        //TODO: Param checks


        //TODO: Make periodic calls to the Database until it's reconnected.
        if (this.ConnectionFailed) return false;


        Collection = this.collectionPrefix + Collection;

        if(Method == "Get"){
            return await this._Get(Collection, Data, Extra);

        }else if(Method == "Post"){
            return await this._Post(Collection, Data);

        } else if (Method == "Edit") {
            return await this._Edit(Collection, Data, Extra);

        } else if (Method == "Delete") {
            return await this._Delete(Collection, Data);

        }else {
            throw new Error(`[Database.HandelMethod()] "Method" was not a valid method. ['Get', 'Post', 'Edit', 'Delete']. Got ${Method}`);
        };
    };*/


    /**
     * Opens a connection to the Database.
     * @returns Database.
     */
    #__Open = async function(){
        if (!MongoDB_URI) throw new Error(`Cannot open Database! URI not set! {.env['DATABASE_URI']}`);
        if (MongoDB_URI.includes('{USERNAME}')) throw new Error(`Cannot open Database! URI USERNAME not set! {.env['DATABASE_USERNAME']}`);
        if (MongoDB_URI.includes('{PASSWORD}')) throw new Error(`Cannot open Database! URI PASSWORD not set! {.env['DATABASE_PASSWORD']}`);
        if (MongoDB_URI.includes('{TABLE}')) throw new Error(`Cannot open Database! URI TABLE not set! {.env['DATABASE_TABLE']}`);

        let promise = await new Promise(function (res, rej) {
            mongo.connect(MongoDB_URI, { useUnifiedTopology: true }, (err, db) => {
                if (err) {
                    let m = '';
                    if (err == 'MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017') {
                        m = 'Check the service: Control Pannel, System+Security/AdminTools/Services/MongoDB Server = "Start"';
                        ConnectionFailed = true;
                    };
                    rej(`Error Opening Database instance!\n${err}`);
                };
                res(db);
            });
        });
        if (!promise) throw new Error(promise);
        return promise;
    };

    /**
     * Close connection to the Database.
     * @param {Object} db Parameter representing a Mongo Database.
     * @returns Promise{ <Any> }
     */

    /**
     *
     * @param {String} collection
     * @param {Object} query
     * @param {Object} proj
     * @param {Object} opt
     * @param {Null|Number} opt.sort
     * @param {Null|Number} opt.limit
     * @returns
     */
    _Get = async function (collection, query, proj, opt = { sort: null, limit: null }) {
        if (!collection || typeof collection !== "string") throw new Error(`[Database._Get()] must have a collection of value string! Got ${typeof collection}`);
        if (typeof query !== "undefined" && typeof query !== "object") throw new Error(`[Database._Get()] 'query' must be undefined or an object! Got ${typeof query}!`);
        if (typeof proj !== "undefined" && typeof proj !== "object") throw new Error(`[Database._Get()] 'proj' must be undefined or an object! Got ${typeof proj}!`);
        if (opt){
            if (typeof opt !== "object") throw new Error(`[Database._Get()] 'opt' must be undefined or an object! Got ${typeof opt}`);
            if (opt.sort && (typeof opt.sort !== Number || opt.sort !== 0 || opt.sort !== 1)) throw new Error(`[Database._Get()] 'opt.sort' must be undefined or a Number with a value of 0 or 1 Got ${typeof opt.sort} : ${opt.sort}`);
            if (opt.limit && typeof opt.limit !== Number) throw new Error(`[Database._Get()] 'opt.limit' must be undefined or a Number with a value of 0 or 1 Got ${typeof opt.limit}`);
        };

        if (!query) query = {};

        let DB; //So we can close the DB later.
        //#region Projections
        let project = {};
        if (proj) {
            project = proj;
        } else {
            // Projection cannot have a mix of inclusion and exclusion.
            //   So if we have a {proj} we cannot hide these values otherwise we'll get an error.
            //   Besides, if the values are not listed in our projection we wont see them anyway!
            project.lastModified = 0;
            project.createdAt = 0;
        };
        project._id = 0; //_id is the only value you can exclude while including items.
        //#endregion

        let sort = opt.sort || null;
        let limit = opt.limit || null;

        return await this.#__Open()
            .then((db) => {
                DB = db;
                return DB.db().collection(collection);
            })
            .then((collection) => {
                return collection.find(query).project(project).sort(sort).limit(Number(limit)).toArray();
            })
            .then(async (result) => {
                DB.close();
                print(`[Get] [${collection}]:
         Proj: ${JSON.stringify(project)}
        Query: ${JSON.stringify(query)}
          Res: ${result}`);
                if (result.length == 0) return false;
                else {
                    return result;
                };
            })
            .catch((err) => {
                console.error(err);
                return err;
            });
    };

    _Post = async function (collection, data) {
        if (!collection || !data) throw new Error(`Post() must have a collection<String> and data<Object>!`);
        if (typeof collection !== "string") throw new Error(`Post() 'collection' must be a string!`);
        if (typeof data !== "object") throw new Error(`Post() 'data' must be an object!`);

        let DB;
        return await this.#__Open()
            .then((db) => {
                DB = db;
                return DB.db().collection(collection);
            })
            .then(async (collection) => {
                data.createdAt = Date.now();
                return await collection.insertOne(
                    data
                );
            })
            .then((result) => {
                DB.close();
                print(`[Post] [${collection}]:
        Data: ${JSON.stringify(data)}`);
                return result;
            })
            .catch((err) => {
                console.error(err);
                return err;
            });
    };

    _Edit = async function (collection, searchQuery, newData, postResult = true) {
        if (!collection || !searchQuery || !newData) throw new Error(`Edit() must have a collection<String>, query<Object>, and newData<Object>!\n Got: collection<${typeof collection}>, query<${typeof query}>, and newData<${typeof newData}>`);
        if (typeof collection !== "string") throw new Error(`Edit() 'collection' must be a string!`);
        if (typeof searchQuery !== "object") throw new Error(`Edit() searchQuery must be an object!`);
        if (typeof newData !== "object") throw new Error(`Edit() newData must be an object!`);


        let DB; //Used to close the Database later..

        return await this.#__Open()
            .then((db) => {
                DB = db;
                return db.db().collection(collection);
            })
            .then((collection) => {
                newData.lastModified = Date.now();
                return collection.updateOne(
                    searchQuery,
                    { $set: newData, },
                    { upsert: true } //if the document {searchQuery} returns null/false, then create a new one with the {newData} obeject.
                );
            })
            .then(async (result) => {
                let msg = `[Edit] [${collection}]:
         Query: ${JSON.stringify(searchQuery)}
        Update: ${JSON.stringify(newData)}`;

                if (result.upsertedId) {
                    /*await this._Edit(collection,
                        { _id: result.upsertedId._id },
                        { createdAt: Date.now() }
                    );*/
                    msg = `[Edit] [${collection}] -> Added new entry.`;
                };

                if (postResult) print(msg);
                DB.close();
                return result;
            })
            .catch((err) => {
                console.error(err);
                return err;
            });
    };

    _Delete = async function (collection, query) {
        if (!collection || !query) throw new Error(`Get() must have a collection<String>, and a query<object>!`);
        if (typeof collection !== "string") throw new Error(`Get() 'collection' must be a string!`);
        if (typeof query !== "object") throw new Error(`Get() 'query' must be an object!`);

        let DB;
        return await this.#__Open()
            .then((db) => {
                DB = db;
                return DB.db().collection(collection);
            })
            .then(async (collection) => {
                return collection.deleteOne(query);
            })
            .then((result) => {
                DB.close();
                print(`[Delete] [${collection}]:
        Data: ${JSON.stringify(query)}`);
                return result;
            })
            .catch((err) => {
                //DB.close();
                console.error(err);
                return err;
            });
    };
};
