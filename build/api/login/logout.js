"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const security_1 = __importDefault(require("./../../controllers/security/security"));
const securityController = new security_1.default();
module.exports = (req, res, next) => {
    try {
        let token = req.headers['sqls'] || req.headers['authorization']; // Express headers are auto converted to lowercase    
        if (token != undefined && token.startsWith('Bearer ')) {
            // Remove Bearer from string
            token = token.slice(7, token.length);
        }
        securityController.logOut(token).then((err) => {
            res.status(200).json({ state: 1, message: "Logout" });
            next();
        });
    }
    catch (ex) {
        console.error("Not logout", ex);
        res.status(500).json({ state: 0, message: "Logout Error" });
    }
};
//# sourceMappingURL=logout.js.map