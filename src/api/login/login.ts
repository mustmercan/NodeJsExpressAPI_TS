
import Security from "./../../controllers/security/security";
const securityController = new Security();

export default (req:any, res:any, next:any) => {
    let attr = {
        IP: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        UserAgent: req.headers['user-agent']
    };

    return res.json({

        token: securityController.login("a", "a",0, attr),
        success: true
    });
};