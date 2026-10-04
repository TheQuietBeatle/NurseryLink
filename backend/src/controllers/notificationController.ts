const pool = require("../config/DB");
import { sendEmail } from "../services/mailer";


// GET /notifications/:account_id
/* getting events/notifications for an account */
export const getNotifications = async (req: any, res: any) => {
    const query = `
        SELECT id, account_id, notification_type, sent_at, seen_at, handled_at, seen, handled, description, priority
        FROM notifications
        WHERE account_id = $1
        ORDER BY sent_at DESC
    `;
    try {
        const result = await pool.query(query, [req.params.account_id]);
        res.send(result.rows);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error fetching notifications');
    }
};


// PUT /notifications/:id/seen
/* marking a notification as seen */
export const markNotificationSeen = async (req: any, res: any) => {
    const query = `
        UPDATE notifications
        SET seen = TRUE, seen_at = COALESCE(seen_at, CURRENT_TIMESTAMP)
        WHERE id = $1
        RETURNING *
    `;
    try {
        const result = await pool.query(query, [req.params.id]);
        res.json(result.rows[0]);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error updating notification');
    }
};


// POST /notifications
/* creating a notification + sending email */
export const createNotification = async (req: any, res: any) => {
    const { account_id, notification_type, description, priority } = req.body;
    const query = `
        INSERT INTO notifications (account_id, notification_type, description, priority, sent_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        RETURNING *
    `;
    try {
        const result = await pool.query(query, [account_id, notification_type, description, priority || 'normal']);
        res.status(201).json(result.rows[0]);

        // Send email to the parent
        const account = await pool.query(`SELECT email, full_name FROM account WHERE id = $1`, [account_id]);
        if (account.rows.length > 0) {
            const { email, full_name } = account.rows[0];
            const priorityLabel = priority === 'urgent' ? 'URGENT' : priority === 'high' ? 'Important' : '';
            const subject = priorityLabel ? `${priorityLabel}: ${notification_type.replace(/_/g, ' ')}` : notification_type.replace(/_/g, ' ');
            sendEmail(
                email,
                subject,
                `<h2>NurseryLink Notification</h2>
                 <p>Dear ${full_name},</p>
                 <p>${description}</p>
                 ${priority === 'urgent' ? '<p style="color:red;font-weight:bold;">This requires your immediate attention.</p>' : ''}
                 <p>— NurseryLink</p>`
            ).catch((e: any) => console.error('Email send failed:', e.message));
        }
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error creating notification');
    }
};


// POST /notifications/:id/email
/* send email notification for an existing notification */
export const emailNotification = async (req: any, res: any) => {
    try {
        const notif = await pool.query(`
            SELECT n.*, a.email, a.full_name
            FROM notifications n
            JOIN account a ON a.id = n.account_id
            WHERE n.id = $1
        `, [req.params.id]);
        if (notif.rows.length === 0) return res.status(404).send('Notification not found');

        const { email, full_name, notification_type, description, priority } = notif.rows[0];
        const priorityLabel = priority === 'urgent' ? 'URGENT' : priority === 'high' ? 'Important' : '';
        const subject = priorityLabel ? `${priorityLabel}: ${notification_type.replace(/_/g, ' ')}` : notification_type.replace(/_/g, ' ');
        const result = await sendEmail(
            email,
            subject,
            `<h2>NurseryLink Notification</h2>
             <p>Dear ${full_name},</p>
             <p>${description}</p>
             ${priority === 'urgent' ? '<p style="color:red;font-weight:bold;">This requires your immediate attention.</p>' : ''}
             <p>— NurseryLink</p>`
        );
        res.json({ success: true, id: result.id });
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error sending email');
    }
};
