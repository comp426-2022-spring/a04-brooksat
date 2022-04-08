const database = require('better-sqlite3')

const logdb = new database('log.db')

const stmt = logdb.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name='userinfo';`)
let row = stmt.get();

if(row === undefined) {
    console.log('Log database missing')

    const sqlInit = `
        CREATE TABLE accesslog (remoteaddr INTEGER, remoteuser TEXT, time, method TEXT, url TEXT, protocol TEXT, httpversion TEXT, status INTEGER, referer TEXT, useragent TEXT);
    `;

    logdb.exec(sqlInit)
} else {
    console.log('Log database exists.')
}






module.exports = logdb










