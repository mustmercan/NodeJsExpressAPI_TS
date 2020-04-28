import { Pool, PoolClient, QueryResult } from 'pg';
const Cursor = require('pg-cursor')
import RedisController from "./redis";
import Crypto from "crypto";
//postgre-root
const pool = new Pool({
    host: 'localhost',
    user: 'nodejs',
    password: 'nodejs',
    database: 'node',
    port: 5432,
})
pool.on('connect', client => {
    console.log("Pool Connect");
    console.info(`DB Connection Status TotalCount:${pool.totalCount} IdleCount:${pool.idleCount} WaitingCount:${pool.waitingCount}`);

});
pool.on('acquire', client => {
    console.log("Pool Acquire");
    console.info(`DB Connection Status TotalCount:${pool.totalCount} IdleCount:${pool.idleCount} WaitingCount:${pool.waitingCount}`);

});
pool.on('remove', client => {
    console.log("Pool Remove");
    console.info(`DB Connection Status TotalCount:${pool.totalCount} IdleCount:${pool.idleCount} WaitingCount:${pool.waitingCount}`);

});
pool.on('error', (err, client) => {
    console.log(`Pool Error`, err);
    console.info(`DB Connection Status TotalCount:${pool.totalCount} IdleCount:${pool.idleCount} WaitingCount:${pool.waitingCount}`);

});

const redisController = new RedisController();

interface CacheData {
    SQL: string | undefined,
    Result: any | undefined;
}

export default class DBOperations {

    private readonly redisPrefix = "DB/";

    constructor() {


    }

    GetNewClient(): Promise<any> {
        return new Promise((resolve: any, reject) => {

            pool.connect((err, client, release) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve({ client: client, release: release });
                }
            })
        }
        );
    }


    ExecuteClientQuery(sql: string, parameters: any[], client: PoolClient): Promise<QueryResult> {
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

    ExecuteQuery(sql: string, parameters: any[] | undefined = undefined): Promise<QueryResult> {
        return new Promise((resolve, reject) => {
            pool.query(sql, parameters as any[], (error, results) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(results);
                }
            });

        });
    }
    /**
     * DB
     * @param table 
     */
    public GetTableData<T>(sql: string): Promise<T>;
    public GetTableData<T>(sql: string, cache?: boolean): Promise<T>;
    public GetTableData<T>(sql: string, cache?: boolean, forceUpdate?: boolean): Promise<T>;
    public GetTableData<T>(sql: string, cache?: boolean, forceUpdate?: boolean, expire?: number): Promise<T> {
        cache = cache ? cache : false;
        forceUpdate = forceUpdate ? forceUpdate : false;
        expire = expire ? expire : 0;
        sql = sql.trim();
        let rediskey = this.GenerateRedisKey(sql);
        return new Promise(async (resolve, reject) => {
            try {
                if (cache && !forceUpdate) {
                    let cacheData=await this.GetCacheData(sql);
                    
                }

            } catch (error) {
                reject(error);
            }

            resolve({} as T);
        })
    }

    CreateCursor = (sql: string, parameters: any = undefined): Promise<any> => {
        return new Promise((resolve, reject) => {
            this.GetNewClient().then(connect => {
                const client = connect.client;
                const cursor = client.query(new Cursor(sql, parameters));
                cursor._client = client;
                cursor.isRelease = false;
                resolve(cursor);
            }).catch(err => { reject(err) });
        })
    }

    ReadCursor = (cursor: any, rowCount: number = 100): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            if (cursor && !cursor.isRelease) {
                cursor.read(rowCount, (err: any, rows: any, result: any) => {
                    if (err) {
                        reject(err);
                    }
                    if (!rows || rows.length <= 0) {
                        cursor.close(() => {
                            cursor._client.release();
                            cursor.isRelease = true;
                        });
                    }
                    resolve(rows);

                })
            }
            else {
                resolve([]);
            }

        })

    }

    GenerateRedisKey = (text: string) => {
        return this.redisPrefix + Crypto.createHash('md5')
            .update(text.trim())
            .digest('hex');
    }

    GetCacheData = async (sql: string) => {
        return new Promise(async (resolve, reject) => {
            let rediskey = this.GenerateRedisKey(sql);
            let data: CacheData | undefined = undefined;
            try {
                data = (await redisController.getData(rediskey)) as CacheData;
                if (data && data.Result) {
                    resolve(data.Result);
                }
                else {
                    resolve(undefined);
                }
            } catch (error) {
                resolve(undefined);
            }
        })
    }

    SetCacheData = async (sql: string, parameters: any[] | undefined = undefined, expire: number = 0): Promise<any> => {
        return new Promise(async (resolve, reject) => {
            let rediskey = this.GenerateRedisKey(sql);
            let data = undefined;
            try {
                data = await this.ExecuteQuery(sql, parameters);
                if (data) {
                    let redisData: CacheData = {
                        SQL: sql,
                        Result: data
                    }
                    await redisController.setData(rediskey, redisData, expire)
                }
                else {
                    resolve(data);
                }
            } catch (error) {
                resolve(data);
            }
        })

    }

    /**
     * Key boş geçilirse tüm DB Cache silinir
     */

    ClearCacheData = async (key: string = "*", sql: string | undefined = undefined) => {
        try {
            let searchKey = this.redisPrefix + key;
            let keys = await redisController.getKeys(searchKey);
            console.log(`DB cache Find Key:${searchKey} & SQL:${sql}, Founded Count: ${keys.length}`)
            if (keys && keys.length > 0) {
                let deleted = 0;
                for (let index = 0; index < keys.length; index++) {
                    const foundKey = keys[index];
                    let data: CacheData | undefined = undefined;
                    try {
                        data = (await redisController.getData(foundKey)) as CacheData;
                    }
                    catch (error) {
                        error == "DELETED" ? deleted++ : deleted;
                        console.log(`[${new Date().toLocaleString()}] ${foundKey}`, error);
                    }
                    if(!sql || (data?.SQL && data.SQL.toLowerCase().includes(sql) ))
                    {
                        redisController.removeData(foundKey);
                        console.log(`[${new Date().toLocaleString()}] ${foundKey} Deleted.`);
                    }
                }
                console.log(`${deleted} DB Cache Data Deleted.`);

            }

        } catch (err) {

        }
    }


}