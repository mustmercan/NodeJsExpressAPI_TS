"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = __importDefault(require("redis"));
class RedisController {
    constructor(RedisClient = undefined) {
        console.log("Redis Start");
        if (RedisClient === undefined) {
            this.redisClient = redis_1.default.createClient({
                port: 6379,
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
    }
    getConnect() {
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
    setData(key, data, expire) {
        return new Promise((resolve, reject) => {
            this.getConnect().then((RedisClient) => {
                expire = Number.isInteger(expire) ? expire : 0; //0 silinmez
                let jsonData = { data: data, createTime: (new Date()).getTime(), expire: expire };
                RedisClient.set(key, JSON.stringify(jsonData), (error, response) => {
                    if (error)
                        reject(error);
                    else
                        resolve(response);
                });
            });
        });
    }
    getData(key) {
        return new Promise((resolve, reject) => {
            this.getConnect().then((RedisClient) => {
                RedisClient.get(key, (error, response) => {
                    if (error)
                        reject(error);
                    else {
                        try {
                            let responseJson = JSON.parse(response);
                            if (responseJson && responseJson != null) {
                                if (responseJson.createTime && responseJson.expire && responseJson.expire > 0) {
                                    let now = (new Date()).getTime();
                                    let createTime = responseJson.createTime;
                                    let lifeSpan = Math.round((now - createTime) / 1000);
                                    if (lifeSpan < responseJson.expire) {
                                        resolve(responseJson.data);
                                    }
                                    else if (lifeSpan == responseJson.expire) {
                                        resolve(responseJson.data);
                                        this.removeData(key);
                                    }
                                    else {
                                        this.removeData(key);
                                        reject("DELETED");
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
                        catch {
                            reject("ERROR");
                        }
                    }
                });
            });
        });
    }
    removeData(key) {
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
}
exports.default = RedisController;
//# sourceMappingURL=redis.js.map