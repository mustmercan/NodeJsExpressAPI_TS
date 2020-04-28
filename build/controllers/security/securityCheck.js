"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const security_1 = __importDefault(require("../security/security"));
let securityController = new security_1.default();
exports.default = (req, res, next) => {
    let token = req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase    
    if (token != undefined && token.startsWith('Bearer ')) {
        // Remove Bearer from string
        token = token.slice(7, token.length);
    }
    securityController.verify(token).then((verify) => {
        if (verify.state <= 0) {
            res.status(401).json({ ...verify, message: "Not Login" }); //... merge
            console.log(`401:${verify.state}:${req.originalUrl}:${token}`);
        }
        else {
            if (verify.state == 2)
                res.setHeader('RefreshToken', verify.refreshToken);
            req.LoginData = verify.data;
            next();
        }
    });
};
//# sourceMappingURL=securityCheck.js.map