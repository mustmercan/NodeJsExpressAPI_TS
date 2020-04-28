import SecurityController,{VerifyStates} from "../security/security";
let securityController = new SecurityController();


export default (req:any, res:any, next:any) => {
    let token = req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase    
    if (token != undefined && token.startsWith('Bearer ')) {
        // Remove Bearer from string
        token = token.slice(7, token.length);
    }
    securityController.verify(token).then((verify) => {
        if (verify.State <= VerifyStates.NotInıt) {
            res.status(401).json({...verify, message: "Not Login" });//... merge
            console.log( `401:${verify.State}:${req.originalUrl}`);
        }
        else {
            if (verify.State == VerifyStates.RefreshToken && verify.LoginData)
            {
                res.setHeader('RefreshToken', verify.LoginData.RefreshToken);
                req.LoginData=verify.LoginData;
            }           
            next();
        }
    }).catch((response)=>{
        console.log(response);
        res.status(502).json({});//... merge
    })
};