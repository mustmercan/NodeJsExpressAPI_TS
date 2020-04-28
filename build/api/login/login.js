"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const security_1 = __importDefault(require("./../../controllers/security/security"));
const securityController = new security_1.default();
module.exports = (req, res, next) => {
    let attr = {
        IP: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        UserAgent: req.headers['user-agent']
    };
    return res.json({
        token: securityController.login("a", "a", 0, attr),
        success: true
    });
};
//# sourceMappingURL=login.js.map