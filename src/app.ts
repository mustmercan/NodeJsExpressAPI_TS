import express from "express";
import helmet from "helmet";//güvenlik için
import path from "path";
import RouterController from "./controllers/routing";
import RedisController from "./controllers/redis";
import cookieParser from 'cookie-parser';
var expressApp =express();
console.log("Starting Server");

//app.use(cors({
//    exposedHeaders: ['Content-Length', 'Content-Type', 'Authorization', 'RefreshToken', 'Token'],
//}));

var bodyParser = require('body-parser');

expressApp.use(bodyParser.urlencoded({
    extended: false
}));

expressApp.use(bodyParser.json());
expressApp.use(cookieParser());
let routingController=new RouterController(expressApp);



expressApp.listen(3535);