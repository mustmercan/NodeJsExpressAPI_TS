import DBOperations from "./../../controllers/db";
const dbOperations = new DBOperations();
export default (req: any, res: any, next: any) => {

    if (req.body && req.body.nick && req.body.password) {
        dbOperations.ExecuteQuery('INSERT INTO public."user"(nick, password)VALUES ( $1, $2);', [req.body.nick, req.body.password])
    }

    return res.json({
        success: false,
        message: 'Auth token is not supplied'
    });
};