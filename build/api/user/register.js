"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./../../controllers/db"));
const dbOperations = new db_1.default();
module.exports = (req, res, next) => {
    if (req.body && req.body.nick && req.body.password) {
        dbOperations.ExecuteQuery('INSERT INTO public."user"(nick, password)VALUES ( $1, $2);', [req.body.nick, req.body.password]);
    }
    return res.json({
        success: false,
        message: 'Auth token is not supplied'
    });
};
//# sourceMappingURL=register.js.map