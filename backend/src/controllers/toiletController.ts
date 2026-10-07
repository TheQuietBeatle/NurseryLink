// const pool = require("../config/DB");
import pool from "../config/DB";

// GET /toilet/:child_id
/* getting toilet visits for a child */
export const getToiletLogs = async (req: any, res: any) => {
    const query = 
`SELECT al.id, al.child_id, al.activity_timestamp, al.comments,
        al.log_details->>'toilet_type' AS toilet_type,
        a.full_name AS recorded_by
 FROM activity_logs al
 JOIN account a ON a.id = al.account_id
 WHERE al.child_id = $1 AND al.log_type = 'toilet'
 ORDER BY al.activity_timestamp DESC`;
    try {
        const result = await pool.query(query, [req.params.child_id]);
        res.send(result.rows);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error fetching toilet logs');
    }
};


// POST /toilet
/* letting a teacher log a toilet visit for a child */
export const logToiletVisit = async (req: any, res: any) => {
    const { account_id, child_id, toilet_type, comments } = req.body;
    const query = `
        INSERT INTO activity_logs (account_id, child_id, log_type, activity_timestamp, comments, log_details)
        VALUES ($1, $2, 'toilet', CURRENT_TIMESTAMP, $3, $4::jsonb)
        RETURNING *
    `;
    try {
        const result = await pool.query(query, [account_id, child_id, comments || null, JSON.stringify({ toilet_type })]);
        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error logging toilet visit');
    }
};
