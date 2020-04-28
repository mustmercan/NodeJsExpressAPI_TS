import redis, { RedisClient } from 'redis';
import { resolveCname } from 'dns';

interface RedisJSONData {
    data: any;
    createTime: number;
    expire: number;
}

export default class RedisController {




    private redisClient: RedisClient;

    constructor(RedisClient: RedisClient | undefined = undefined) {
        console.log("Redis Start");
        if (RedisClient === undefined) {
            this.redisClient = redis.createClient({
                port: 6379,               // replace with your port
                host: 'localhost'
            });
        }
        else {
            this.redisClient = RedisClient;
        }


        this.redisClient.on("error", function (err) {
            console.error("Error " + err);
        });
        this.redisClient.on("connect", function (err) {
            console.log("Redis Connect");
        });
        this.redisClient.on("ready", function (err) {
            console.log("Redis Ready");
        });
        this.redisClient.on("end", function (err) {
            console.warn("Redis Connection END.");
        });
        this.redisClient.on("reconnecting", function (err) {
            console.warn("Redis Reconnecting.");
        });
        
        this.checkExpire();
        setInterval(()=>this.checkExpire(),300000);//5dk;
    }

    getConnect(): Promise<RedisClient> {
        return new Promise((resolve, reject) => {
            if (!this.redisClient.connected) {
                this.redisClient.on("connect", () => {
                    return resolve(this.redisClient);
                });
            }
            else {
                return resolve(this.redisClient);
            }
        });


    }
    /**
     * 
     * @param key string
     * @param data json object
     * @param expire Second
     */
    setData(key: string, data: any, expire: number): Promise<any> {
        return new Promise((resolve, reject) => {
            this.getConnect().then((RedisClient) => {
                expire = Number.isInteger(expire) ? expire : 0;//0 silinmez
                let jsonData: RedisJSONData = { data: data, createTime: (new Date()).getTime(), expire: expire };
                RedisClient.set(key, JSON.stringify(jsonData), (error, response) => {
                    if (error)
                        reject(error);
                    else
                        resolve(response);
                });
            });
        });
    }

    async getData(key: string): Promise<any> {
        return new Promise((resolve, reject) => {

            this.getConnect().then((RedisClient) => {

                RedisClient.get(key, (error, response) => {
                    if (error)
                        reject(error);
                    else {
                        try {
                            let responseJson: RedisJSONData = JSON.parse(response);
                            if (responseJson && responseJson != null) {
                                if (responseJson.createTime && responseJson.expire && responseJson.expire > 0) {
                                    let now = (new Date()).getTime();
                                    let createTime = responseJson.createTime;
                                    let lifeSpan = Math.round((now - createTime) / 1000);

                                    if (lifeSpan < responseJson.expire) {
                                        resolve(responseJson.data);
                                    }
                                    else {
                                        this.removeData(key);
                                        reject("DELETED")
                                    }
                                }
                                else {
                                    resolve(responseJson.data);
                                }
                            }
                            else {
                                reject(`${key} IS NULL`);
                            }
                        }
                        catch(error)
                        {
                            reject(error);
                        }


                    }

                });


            });


        });
    }

    removeData(key: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.getConnect().then((RedisClient) => {
                RedisClient.del(key, (error, response) => {
                    if (error)
                        reject(error);
                    else
                        resolve(response);
                });
            });
        });
    }

    checkExpire = async () => {
        return new Promise(async (resolve, reject) => {

            this.getConnect().then(async (RedisClient) => {

                RedisClient.keys('*', async (err, keys) => {

                    if(err)
                    {
                        reject(err);
                    }

                    console.log(`[${new Date().toLocaleString()}] Check Expire: ${keys.length} Keys Found`);
                    let deleted = 0;
                    for (let i = 0; i < keys.length; i++) {
                        const key = keys[i];
                        let data;
                        try {
                            data = await this.getData(key);
                        }
                        catch (error) {
                            error=="DELETED" ? deleted++ : deleted;
                            console.log(`[${new Date().toLocaleString()}] ${key}`, error);
                        }
                    }
                       
                    
                    console.log(`[${new Date().toLocaleString()}] Deleted Count: ${deleted}`)
                    resolve(deleted);
                })
            },(error)=>{
                reject(error)
            })
        })
    }

    getKeys=async(key:string="*"):Promise<string[]>=>
    {
        return new Promise(async (resolve, reject) => {

            this.getConnect().then(async (RedisClient) => {

                RedisClient.keys(key, async (err, keys) => {
                    if(err)
                    {
                        reject(err);
                    }

                    resolve(keys);

                })

            });
        });
    }

}