"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    host: 'localhost',
    user: 'nodejs',
    password: 'nodejs',
    database: 'node',
    port: 5432,
});
pool.on('connect', client => {
    console.log("Pool Connect");
    console.info(`DB Connection Status TotalCOunt:${pool.totalCount} IdleCount:${pool.idleCount} WaitingCount:${pool.waitingCount}`);
});
pool.on('acquire', client => {
    console.log("Pool Acquire");
    console.info(`DB Connection Status TotalCOunt:${pool.totalCount} IdleCount:${pool.idleCount} WaitingCount:${pool.waitingCount}`);
});
pool.on('remove', client => {
    console.log("Pool Remove");
    console.info(`DB Connection Status TotalCOunt:${pool.totalCount} IdleCount:${pool.idleCount} WaitingCount:${pool.waitingCount}`);
});
pool.on('error', (err, client) => {
    console.log(`Pool Error:${err}`);
    console.info(`DB Connection Status TotalCOunt:${pool.totalCount} IdleCount:${pool.idleCount} WaitingCount:${pool.waitingCount}`);
});
class DBOperations {
    constructor() {
    }
    GetNewClient() {
        return new Promise((resolve, reject) => {
            pool.connect((err, client, release) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve({ client, release });
                }
            });
        });
    }
    ExecuteClientQuery(sql, parameters, client) {
        return new Promise((resolve, reject) => {
            client.query(sql, parameters, (error, results) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(results);
                }
            });
        });
    }
    ExecuteQuery(sql, parameters = undefined) {
        return new Promise((resolve, reject) => {
            pool.query(sql, parameters, (error, results) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(results);
                }
            });
        });
    }
}
exports.default = DBOperations;
//# sourceMappingURL=db.js.map