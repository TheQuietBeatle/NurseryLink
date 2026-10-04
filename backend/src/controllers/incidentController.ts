const pool = require("../config/DB");


// GET /incidents/:child_id
/* getting incident reports for a child */
export const getIncidents = async (req: any, res: any) => {
    const query = `
        SELECT
            ir.id,
            ir.child_id,
            ir.description,
            ir.severity_level,
            ir.incident_timestamp,
            ir.reported_at,
            ir.resolved_at,
            a.full_name AS teacher_name,
            (
                SELECT MIN(itp2.acknowledged_at)
                FROM incident_to_parent itp2
                WHERE itp2.incidient_id = ir.id
            ) AS acknowledged_at
        FROM incidient_report ir
        JOIN teacher t ON t.id = ir.teacher_id
        JOIN account a ON a.id = t.account_id
        WHERE ir.child_id = $1
        ORDER BY ir.incident_timestamp DESC
    `;
    try {
        const result = await pool.query(query, [req.params.child_id]);
        res.send(result.rows);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error fetching incidents');
    }
};


// POST /incidents
/* letting a teacher file an incident report; notifies every linked parent */
export const fileIncident = async (req: any, res: any) => {
    const { child_id, teacher_id, description, severity_level } = req.body;
    try {
        const incident = await pool.query(
            `INSERT INTO incidient_report (child_id, teacher_id, description, severity_level, incident_timestamp)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
             RETURNING *`,
            [child_id, teacher_id, description, severity_level],
        );

        const linkedParents = await pool.query(
            `SELECT cp.parent_id, p.account_id
             FROM child_parent cp
             JOIN parent p ON p.id = cp.parent_id
             WHERE cp.child_id = $1`,
            [child_id],
        );

        const priorityBySeverity: Record<string, string> = {
            low: 'low',
            medium: 'normal',
            high: 'high',
            critical: 'urgent',
        };

        for (const parent of linkedParents.rows) {
            await pool.query(
                'INSERT INTO incident_to_parent (incidient_id, parent_id) VALUES ($1, $2)',
                [incident.rows[0].id, parent.parent_id],
            );
            await pool.query(
                `INSERT INTO notifications (account_id, notification_type, description, priority)
                 VALUES ($1, 'incident', $2, $3)`,
                [parent.account_id, description, priorityBySeverity[severity_level] ?? 'normal'],
            );
        }

        res.status(201).json(incident.rows[0]);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error filing incident report');
    }
};
