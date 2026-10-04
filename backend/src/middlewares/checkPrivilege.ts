
import verifyToken from "./verifyToken";
import pool from "../config/DB";


export const checkprivilege=(privilege_id: number) => {
    return async (req: any, res: any, next: any) => {
        try{
            const result=await pool.query(
                `SELECT privilege_id FROM admin_previlledge WHERE account_id=$1 AND privilege_id=$2`,
                [req.user.Current_id, privilege_id]
            );
            if (result.rows.length === 0) {
                console.log("nanaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
                return res.status(403).json({
                    message: "You are not authorized to do this action"
                });
            }
            next();
            console.log("yessssssssssssssssssssssssssssssss");
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Error checking privilege"
            });
        }
    }
};

// }
// app.post("/check-privilege", verifyToken, async (req: any, res: any) => {

//     const { privilege_id } = req.body;

//     const current_admin_id = req.user.Current_id;

//     const checkQuery = `
//         SELECT privilege_id
//         FROM admin_previlledge
//         WHERE account_id = $1
//           AND privilege_id = $2
//     `;

// //     const checkresult = await pool.query(checkQuery, [
//         current_admin_id,
//         privilege_id
//     ]);

//     if (checkresult.rows.length === 0) {
//         return res.status(403).json({
//             message: "You are not authorized to enter this page"
//         });
//     }

//     return res.status(200).json({
//         message: "Welcome"
//     });
// });
