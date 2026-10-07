import pool from "../config/DB";


// GET /attendance/:child_id
/* getting attendance history for a child */
export const getAttendance = async (req: any, res: any) => {
    const query = `
        SELECT
            ar.id,
            ar.child_id,
            ar.check_in_time,
            ar.check_out_time,
            ar.status,
            ar.reason,
            ar.recorded_at,
            a.full_name AS recorded_by
        FROM attendance_records ar
        JOIN account a ON a.id = ar.admin_id
        WHERE ar.child_id = $1
        ORDER BY ar.check_in_time DESC
    `;
    try {
        const result = await pool.query(query, [req.params.child_id]);
        res.send(result.rows);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error fetching attendance records');
    }
};


// POST /attendance/checkin
/* letting a teacher check in a child */
export const checkIn = async (req: any, res: any) => {
    const { child_id, admin_id } = req.body;
    const query = `
        INSERT INTO attendance_records (child_id, admin_id, check_in_time, status, recorded_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP, TRUE, CURRENT_TIMESTAMP)
        RETURNING *
    `;
    try {
        const result = await pool.query(query, [child_id, admin_id]);
        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error checking in child');
    }
};


// PUT /attendance/:id/checkout
/* letting a teacher check out a child */
export const checkOut = async (req: any, res: any) => {
    const query = `
        UPDATE attendance_records
        SET check_out_time = CURRENT_TIMESTAMP, status = FALSE
        WHERE id = $1
        RETURNING *
    `;
    try {
        const result = await pool.query(query, [req.params.id]);
        if (result.rows.length === 0) return res.status(404).send('Record not found');
        res.json(result.rows[0]);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error checking out child');
    }
};
