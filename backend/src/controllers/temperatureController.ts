const pool = require("../config/DB");
import { sendEmail } from "../services/mailer";


// GET /temperature/:child_id
/* getting the temps of children as a Json  */
export const getTemperatures = async (req: any, res: any) => {
    const query = `
        SELECT * FROM activity_logs
        WHERE child_id = $1 AND log_type = 'temperature'
        ORDER BY activity_timestamp DESC
    `;
    const result = await pool.query(query, [req.params.child_id]);
    res.send(result.rows);
};


// POST /temperature
/* letting a parent log a temperature reading for their child */
export const logTemperature = async (req: any, res: any) => {
    const { account_id, child_id, degree_celsius, comments } = req.body;
    const query = `
        INSERT INTO activity_logs (account_id, child_id, log_type, activity_timestamp, degree_celsius, comments)
        VALUES ($1, $2, 'temperature', CURRENT_TIMESTAMP, $3, $4)
        RETURNING *
    `;
    try {
        const result = await pool.query(query, [account_id, child_id, degree_celsius, comments || null]);
        res.status(201).json(result.rows[0]);

        // Notify every linked parent (email + in-app) if temperature is high
        if (degree_celsius >= 38.0) {
            const child = await pool.query('SELECT name FROM child WHERE id = $1', [child_id]);
            const childName = child.rows[0]?.name ?? 'Your child';
            const severity = degree_celsius >= 38.5 ? 'HIGH FEVER' : 'Fever';

            const linkedParents = await pool.query(`
                SELECT a.id AS account_id, a.email, a.full_name
                FROM child_parent cp
                JOIN parent p ON p.id = cp.parent_id
                JOIN account a ON a.id = p.account_id
                WHERE cp.child_id = $1
            `, [child_id]);

            for (const parent of linkedParents.rows) {
                sendEmail(
                    parent.email,
                    `${severity} Alert - ${childName}`,
                    `<h2>${severity} Detected</h2>
                     <p>Dear ${parent.full_name},</p>
                     <p><strong>${childName}</strong> has a temperature of <strong>${degree_celsius}°C</strong>.</p>
                     <p>${comments || 'Please check on your child.'}</p>
                     <p>— NurseryLink</p>`
                ).catch((e: any) => console.error('Email send failed:', e.message));

                pool.query(
                    `INSERT INTO notifications (account_id, notification_type, description, priority)
                     VALUES ($1, 'temperature_alert', $2, $3)`,
                    [
                        parent.account_id,
                        `${severity}: ${childName}'s temperature is ${degree_celsius}°C.${comments ? ` ${comments}` : ''}`,
                        degree_celsius >= 38.5 ? 'urgent' : 'high',
                    ],
                ).catch((e: any) => console.error('Notification insert failed:', e.message));
            }
        }
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error logging temperature');
    }
};
