"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const redis_1 = __importDefault(require("../redis"));
const db_1 = __importDefault(require("../db"));
let redisController = new redis_1.default();
let dbOperations = new db_1.default();
class Security {
    constructor() {
        this.secretKey = "TOPSECRET";
        this.expire = 60 * 60;
        this.refreshTokenTime = 10 * 60; //10dk;
        this.redisPrefix = "LOGIN_";
    }
    login(userName, password, expire, attribute) {
        let isCorrect = userName == password;
        let token = undefined;
        if (isCorrect) {
            token = this.registerToken("35", expire, attribute);
        }
        return { isLogin: token != undefined, token: token };
    }
    registerToken(userID, expire, attribute) {
        expire = Number.isInteger(expire) ? expire : this.expire;
        let tokenData = { UserID: userID, CreateDate: (new Date()).getTime(), Expire: expire, exp: 0 };
        let token = jsonwebtoken_1.default.sign(tokenData, this.secretKey, {
            expiresIn: expire == 0 ? "365d" : expire //second unit is used by default                    
        });
        redisController.setData(this.redisPrefix + token, { TokenData: tokenData, Attribute: attribute }, expire);
        return token;
    }
    logOut(token) {
        return redisController.removeData(this.redisPrefix + token);
    }
    verify(token) {
        return new Promise((resolve, reject) => {
            if (!token || token === "") {
                resolve({ state: 0 });
                return;
            }
            jsonwebtoken_1.default.verify(token, this.secretKey, (err, decoded) => {
                let tokenData = decoded;
                if (err) {
                    resolve({ state: 0 });
                }
                else {
                    redisController.getData(this.redisPrefix + token).then((data) => {
                        if (data && data.TokenData.UserID == tokenData.UserID) {
                            let now = (new Date()).getTime();
                            let createTime = (new Date(tokenData.CreateDate)).getTime();
                            let lifeSpan = tokenData.Expire - (Math.round((now - createTime) / 1000));
                            let refreshToken = lifeSpan > 0 && lifeSpan <= this.refreshTokenTime;
                            if (tokenData.Expire == 0) {
                                lifeSpan = Math.round(((new Date(tokenData.exp * 1000).getTime()) - now) / 1000); //oturum devamlı açık kalsın denirse 
                                refreshToken = Math.round((now - createTime) / 1000) > (this.expire - this.refreshTokenTime); //default expire tarihini geçerse yeni verilecek
                            }
                            data.LifeSpan = lifeSpan;
                            if (data.Attribute.OldToken) {
                                this.logOut(data.Attribute.OldToken); //refresh token ile gelindiğinde eski token silinicek
                            }
                            if (refreshToken) {
                                let refreshTokenData = data.RefreshToken;
                                if (!data.RefreshToken || refreshTokenData == "") {
                                    data.Attribute.OldToken = token;
                                    refreshTokenData = this.registerToken(tokenData.UserID, tokenData.Expire, data.Attribute);
                                    data.RefreshToken = refreshTokenData;
                                    redisController.setData(this.redisPrefix + token, data, tokenData.Expire);
                                }
                                resolve({ state: 2, refreshToken: refreshTokenData, data: data });
                            }
                            else if (lifeSpan > 0) {
                                resolve({ state: 1, refreshToken: undefined, data: data });
                            }
                            else {
                                redisController.removeData(this.redisPrefix + token);
                                resolve({ state: -1 });
                            }
                        }
                        else {
                            this.logOut(token); //token ile redis uyuşmaz ise
                        }
                    }).catch((res) => { resolve({ state: -2 }); });
                }
            });
        });
    }
}
exports.default = Security;
module.exports = Security;
//# sourceMappingURL=security.js.map