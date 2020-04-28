import Security from "./../../controllers/security/security";
const securityController = new Security();
export default (req:any, res:any, next:any) => {
    try
    {
        let token = req.headers['sqls'] || req.headers['authorization']; // Express headers are auto converted to lowercase    
        if (token != undefined && token.startsWith('Bearer ')) {
            // Remove Bearer from string
            token = token.slice(7, token.length);
        }
        securityController.logOut(token).then((err)=>{
            res.status(200).json({ state: 1, message: "Logout" });
            next();
        });
 
    }
    catch(ex)
    {
        console.error("Not logout",ex);
        res.status(500).json({ state: 0, message: "Logout Error" });
    } 
};
