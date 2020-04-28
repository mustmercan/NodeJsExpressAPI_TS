"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./../../controllers/db"));
const dbOperations = new db_1.default();
module.exports = (req, res, next) => {
    dbOperations.ExecuteQuery('SELECT * FROM public."user"').then((result) => {
        res.json(result.rows);
    }).catch((err) => {
        res.status(500).json(err);
    });
};
//# sourceMappingURL=list.js.map