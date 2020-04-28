import DBOperations from "./../../controllers/db";
import { brotliDecompress } from "zlib";
const dbOperations = new DBOperations();
let Cursor:any=undefined;
export default (req: any, res: any, next: any) => {
    // dbOperations.ExecuteQuery('SELECT * FROM public."user"').then((result: any) => {
    //     res.json(result.rows);
    // }).catch((err: Error) => {
    //     res.status(500).json(err)
    // })
    let i=req.body.index?req.body.index as number:0;

    if(!Cursor)
    {
        dbOperations.CreateCursor('SELECT * FROM public."user"').then(cursor=>{
            Cursor=cursor;
            dbOperations.ReadCursor(cursor,1000).then(response=>{
                res.json(response);
            });
        })
    }
    else
    {
        dbOperations.ReadCursor(Cursor,1000).then(response=>{
            res.json(response);
        });

    }



    // for (let index = 0; index < 2000; index++) {
    //     dbOperations.ExecuteQuery(`insert into public."user" (nick,password,state)values('T${index}','T${index}',-1)`);
        
    // }

};