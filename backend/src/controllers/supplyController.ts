const pool = require("../config/DB");


// GET /supplies/:account_id
/* getting supply requests for a parent */
export const getSupplyRequests = async (req: any, res: any) => {
    const query = `
        SELECT
            sr.id,
            sr.item,
            sr.quantity,
            sr.note,
            sr.requested_at,
            sr.fulfilled_at,
            sr.status,
            a.full_name AS teacher_name,
            srtp.responded_at,
            srtp.response
        FROM supply_request sr
        JOIN teacher t ON t.id = sr.teacher_id
        JOIN account a ON a.id = t.account_id
        JOIN supplyrequest_to_parent srtp ON srtp.supply_id = sr.id
        JOIN parent p ON p.id = srtp.parent_id
        WHERE p.account_id = $1
        ORDER BY sr.requested_at DESC
    `;
    try {
        const result = await pool.query(query, [req.params.account_id]);
        res.send(result.rows);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error fetching supply requests');
    }
};
