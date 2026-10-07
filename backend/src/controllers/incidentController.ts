import pool from "../config/DB";
import { notifyAccounts } from "../services/notify";

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
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const incident = await client.query(
            `INSERT INTO incidient_report (child_id, teacher_id, description, severity_level, incident_timestamp)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
             RETURNING *`,
            [child_id, teacher_id, description, severity_level],
        );

        const linkedParents = await client.query(
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
            await client.query(
                'INSERT INTO incident_to_parent (incidient_id, parent_id) VALUES ($1, $2)',
                [incident.rows[0].id, parent.parent_id],
            );

            // Insert into notifications table
            const notificationResult = await client.query(
                `INSERT INTO notifications (notification_type, description, priority, sent_at)
                 VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                 RETURNING *`,
                ['incident', description, priorityBySeverity[severity_level] ?? 'normal'],
            );

            // Insert into account_notification junction table
          await notifyAccounts(
            linkedParents.rows.map((parent: any) => parent.account_id),
            'incident',
            description,
            priorityBySeverity[severity_level] ?? 'normal'
          )
        }

        await client.query('COMMIT');
        res.status(201).json(incident.rows[0]);
    } catch (err: any) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send('Error filing incident report');
    } finally {
        client.release();
    }
};
