"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const routing_1 = __importDefault(require("./controllers/routing"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
var expressApp = express_1.default();
console.log("Starting Server");
//app.use(cors({
//    exposedHeaders: ['Content-Length', 'Content-Type', 'Authorization', 'RefreshToken', 'Token'],
//}));
var bodyParser = require('body-parser');
expressApp.use(bodyParser.urlencoded({
    extended: false
}));
expressApp.use(bodyParser.json());
expressApp.use(cookie_parser_1.default());
let routingController = new routing_1.default(expressApp);
expressApp.listen(3535);
//# sourceMappingURL=app.js.map