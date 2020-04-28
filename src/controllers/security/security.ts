import jwt from 'jsonwebtoken';
import RedisController from "../redis";
import DBOperations from "../db";
import Crypto from "crypto";


const redisController = new RedisController();
const dbOperations = new DBOperations();



interface TokenData {
    UserID: string;
    CreateDate: number;
    Expire: number;
}

export interface ParsedToken extends TokenData {
    iss: string
    sub: string
    aud: string | string[]
    iat: number
    exp: number
    azp: string
    scope: string
}

export interface RedisLoginData {
    Token: string,
    TokenData: TokenData;
    Attribute: any;
    OldToken: string | undefined;
    RefreshToken: string | undefined;
}

export enum VerifyStates {
    RefreshToken = 2,
    LoginOK = 1,
    NotInıt = 0,
    TokenisNull = -1,
    TokenParseError = -2,
    RedisDataNotFound = -3,
    TokenUserIDNotEqualsRedis = -4,
    TokenExpire = -5,
}

export interface VerifyData {
    Token: string,
    State: VerifyStates,
    Error: Error | undefined | any,
    LoginData: RedisLoginData | undefined,
    LifeSpan: number,
    LifeTime: number
}

export interface LoginResult {
    isLogin: boolean,
    LoginData: RedisLoginData | undefined,

}

export default class Security {


    private readonly secretKey = "TOPSECRET";
    private readonly secretHashKey = "Y5556-996";
    private readonly refreshTokenTime = 10 * 60;//10dk;
    private readonly defaultExpire = 2*60 * 60;//2 sa;
    private readonly redisPrefix = "LOGIN/";
    private readonly maxExpire = 365 * 24 * 60 * 60;//365 gün



    constructor() {

    }

    generateRedisKey = (text: string) => {
        return this.redisPrefix + Crypto.createHmac('sha1', this.secretHashKey)
            .update(text.trim())
            .digest('hex');
    }

    login(userName: string, password: string, expire: number, attribute: any): LoginResult {
        let isCorrect = userName == password;
        let token = undefined;
        if (isCorrect) {
            token = this.registerToken("35", expire, attribute);
        }
        let loginResult: LoginResult = { isLogin: isCorrect, LoginData: token }
        return loginResult;

    }

    registerToken(userID: string, expire: number, attribute: any, oldToken: string | undefined = undefined): RedisLoginData {
        expire = expire == 0 ? this.maxExpire : expire;

        let tokenData: TokenData = { UserID: userID, CreateDate: (new Date()).getTime(), Expire: expire };
        let token = jwt.sign(tokenData,
            this.secretKey,
            {
                expiresIn: expire//second unit is used by default '365d'              
            }
        );
        let redisLoginData: RedisLoginData = { Token: token, TokenData: tokenData, Attribute: attribute, OldToken: oldToken, RefreshToken: undefined };
        redisController.setData(this.generateRedisKey(token), redisLoginData, expire);
        return redisLoginData;
    }

    logOut(token: string) {
        return redisController.removeData(this.generateRedisKey(token));
    }
    verify(token: string): Promise<VerifyData> {
        return new Promise((resolve, reject) => {
            let verifyData: VerifyData = { Token: token, State: VerifyStates.NotInıt, Error: undefined, LoginData: undefined, LifeSpan: 0, LifeTime: 0 };
            if (!token || token === "") {
                verifyData.State = VerifyStates.TokenisNull;
                resolve(verifyData);
                return;
            }
            jwt.verify(token, this.secretKey, (err, decoded: Object) => {

                let tokenData: ParsedToken = decoded as ParsedToken;

                if (err) {
                    verifyData.State = VerifyStates.TokenParseError;
                    verifyData.Error = err;
                    resolve(verifyData);
                } else {
                    let redisKey=this.generateRedisKey(token);
                    redisController.getData(redisKey).then((data: RedisLoginData) => {
                        if (data && data.TokenData.UserID == tokenData.UserID) {
                            let now = (new Date()).getTime();
                            let createTime = tokenData.CreateDate;
                            let lifeTime = Math.round((now - createTime) / 1000);//sn olarak geçen süre
                            let lifeSpan = tokenData.Expire - lifeTime;//sn olarak kalan süre

                            let newTokenGenerate = lifeSpan > 0 && 
                            ((this.maxExpire==tokenData.Expire && this.defaultExpire-lifeTime <= this.refreshTokenTime)||
                             lifeSpan <= this.refreshTokenTime);//yeni token gerekiyormu

                            verifyData.LifeSpan = lifeSpan;
                            verifyData.LifeTime = lifeTime;

                            if (data.OldToken) {
                                this.logOut(data.OldToken);//refresh token ile gelindiğinde eski token silinicek
                                data.OldToken = undefined;
                            }

                            if (newTokenGenerate) {
                                if (!data.RefreshToken || data.RefreshToken == "") {
                                    let newLogin = this.registerToken(tokenData.UserID, tokenData.Expire, data.Attribute, token);
                                    data.RefreshToken = newLogin.Token;
                                    redisController.setData(redisKey, data, tokenData.Expire);
                                }

                                verifyData.State = VerifyStates.RefreshToken;
                                verifyData.LoginData = data;

                                // resolve({ state: 2, refreshToken: refreshTokenData, data: data });
                                resolve(verifyData);
                            }
                            else if (lifeSpan > 0) {
                                verifyData.State = VerifyStates.LoginOK;
                                verifyData.LoginData = data;
                                resolve(verifyData);
                            }
                            else {
                                verifyData.State = VerifyStates.TokenExpire;
                                resolve(verifyData);
                            }

                        }
                        else {
                            this.logOut(token);//token ile redis uyuşmaz ise
                            verifyData.State = VerifyStates.TokenUserIDNotEqualsRedis;
                            resolve(verifyData);
                        }
                    }).catch((res) => {
                        verifyData.State = VerifyStates.RedisDataNotFound;
                        verifyData.Error = res;
                        resolve(verifyData);
                    });
                }
            });

        });
    }



}
