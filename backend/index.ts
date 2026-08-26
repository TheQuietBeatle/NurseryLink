const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");
import { sendEmail } from "./mailer";

//middleware
app.use(cors());
app.use(express.json()); //req.body


//routes //
//create account//

app.post('/account', async (req: any, res: any) => {
    const { username, full_name, email, password, role } = req.body;
    const query = 'INSERT INTO account (username, full_name, email, password, role) VALUES ($1, $2, $3, $4, $5)';
    const values = [username, full_name, email, password, role];
    try {
        const result = await pool.query(query, values);
        res.send('Account created successfully');
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error creating account');
    }
});

/*
{
  "username": "george2",
  "full_name": "George Sameh",
  "email": "george2@example.com",
  "password": "pw123",
  "role": "parent"
}
 */
//get all accounts with role //
app.get('/account/role/:role', async (req: any, res: any) => {
    const query = 'SELECT * FROM account WHERE role = $1';
    const result = await pool.query(query, [req.params.role]);
    res.send(result.rows);
})
//get an account //
app.get('/account/id/:id', async (req: any, res: any) => {
    const query = 'SELECT * FROM account WHERE id = $1';
    const result = await pool.query(query, [req.params.id]);
    res.send(result.rows);
});

//update an account //
app.put('/account/:id', async (req: any, res: any) => {
    const { username, full_name, email, password, role } = req.body;
    const query = 'UPDATE account SET username = $1, full_name = $2, email = $3, password = $4, role = $5 WHERE id = $6';
    const values = [username, full_name, email, password, role, req.params.id];
    try {
        const result = await pool.query(query, values);
        res.send('Account updated successfully');
        await sendEmail(
            email,
            "Account Info Changed",
            `<h2>Your Account Information Has Been Changed Successfully</h2>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Password:</strong> ${password}</p>
             <p>If you did not make this change, please contact support immediately.</p>`
        );
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error updating account');
    }
});


//delete an account //
app.delete('/account/:id', async (req: any, res: any) => {
    const query = 'DELETE FROM account WHERE id = $1';
    const result = await pool.query(query, [req.params.id]);
    res.send('Account deleted successfully');
});
//login //

//add login route //
app.post('/Login', async (req: any, res: any) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM account WHERE email = $1 AND password = $2';
    const result = await pool.query(query, [email, password]);
    if (result.rows.length === 0) {
        res.status(401).send('Invalid credentials');
    }
    else if (result.rows.length === 1) {
        res.json({
            id: result.rows[0].id,
            full_name: result.rows[0].full_name,
            email: result.rows[0].email,
            role: result.rows[0].role,
        });
    }
    else {
        res.status(500).send('Error logging in');
    }
});

/* get all children linked to a parent's account (covers both parents in a family) */
app.get('/children/account/:account_id', async (req: any, res: any) => {
    const query = `
        SELECT c.* FROM child c
        JOIN child_parent cp ON cp.child_id = c.id
        JOIN parent p ON p.id = cp.parent_id
        WHERE p.account_id = $1
    `;
    const result = await pool.query(query, [req.params.account_id]);
    res.send(result.rows);
})

app.get('/', (req: any, res: any) => {
    res.send('Hello World!');
});

app.post('/test-email', async (req: any, res: any) => {
    const { to } = req.body;
    try {
        const result = await sendEmail(to, "Test Email", "<h1>Test Email</h1>");
        res.json(result);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error sending email');
    }
});

/* getting the temps of children as a Json  */
app.get('/temperature/:child_id', async (req: any, res: any) => {
    const query = `
        SELECT * FROM activity_logs
        WHERE child_id = $1 AND log_type = 'temperature'
        ORDER BY activity_timestamp DESC
    `;
    const result = await pool.query(query, [req.params.child_id]);
    res.send(result.rows);
})

/* letting a parent log a temperature reading for their child */
app.post('/temperature', async (req: any, res: any) => {
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
})
/* getting incident reports for a child */
app.get('/incidents/:child_id', async (req: any, res: any) => {
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
});

/* getting meal logs for a child */
app.get('/meals/:child_id', async (req: any, res: any) => {
    const query = `
        SELECT
            al.id,
            al.child_id,
            al.activity_timestamp,
            al.comments,
            al.food_portion,
            al.meal_type,
            a.full_name AS teacher_name
        FROM activity_logs al
        JOIN account a ON a.id = al.account_id
        WHERE al.child_id = $1 AND al.log_type = 'meal'
        ORDER BY al.activity_timestamp DESC
    `;
    try {
        const result = await pool.query(query, [req.params.child_id]);
        res.send(result.rows);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error fetching meals');
    }
});

/* letting a teacher log a meal for a child */
app.post('/meals', async (req: any, res: any) => {
    const { account_id, child_id, meal_type, food_portion, comments } = req.body;
    const query = `
        INSERT INTO activity_logs (account_id, child_id, log_type, activity_timestamp, comments, food_portion, meal_type)
        VALUES ($1, $2, 'meal', CURRENT_TIMESTAMP, $3, $4, $5)
        RETURNING *
    `;
    try {
        const result = await pool.query(query, [account_id, child_id, comments || null, food_portion, meal_type]);
        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error logging meal');
    }
});

/* getting the teacher record (and assigned class) for an account */
app.get('/teacher/account/:account_id', async (req: any, res: any) => {
    const query = `
        SELECT t.id, t.account_id, t.class_id, c.class_name
        FROM teacher t
        JOIN class c ON c.class_id = t.class_id
        WHERE t.account_id = $1
    `;
    try {
        const result = await pool.query(query, [req.params.account_id]);
        res.send(result.rows[0] ?? null);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error fetching teacher');
    }
});

/* getting today's roster for a class: each child plus their latest activity today */
app.get('/class/:class_id/roster', async (req: any, res: any) => {
    const query = `
        SELECT
            c.id,
            c.name,
            c.date_of_birth,
            att.check_in_time,
            att.check_out_time,
            temp.degree_celsius AS last_temp,
            temp.activity_timestamp AS last_temp_at,
            meal.meal_type AS last_meal_type,
            meal.food_portion AS last_meal_portion,
            meal.activity_timestamp AS last_meal_at,
            toilet.activity_timestamp AS last_toilet_at
        FROM child c
        LEFT JOIN LATERAL (
            SELECT check_in_time, check_out_time FROM attendance_records
            WHERE child_id = c.id AND check_in_time::date = CURRENT_DATE
            ORDER BY check_in_time DESC LIMIT 1
        ) att ON true
        LEFT JOIN LATERAL (
            SELECT degree_celsius, activity_timestamp FROM activity_logs
            WHERE child_id = c.id AND log_type = 'temperature' AND activity_timestamp::date = CURRENT_DATE
            ORDER BY activity_timestamp DESC LIMIT 1
        ) temp ON true
        LEFT JOIN LATERAL (
            SELECT meal_type, food_portion, activity_timestamp FROM activity_logs
            WHERE child_id = c.id AND log_type = 'meal' AND activity_timestamp::date = CURRENT_DATE
            ORDER BY activity_timestamp DESC LIMIT 1
        ) meal ON true
        LEFT JOIN LATERAL (
            SELECT activity_timestamp FROM activity_logs
            WHERE child_id = c.id AND log_type = 'toilet' AND activity_timestamp::date = CURRENT_DATE
            ORDER BY activity_timestamp DESC LIMIT 1
        ) toilet ON true
        WHERE c.class_id = $1
        ORDER BY c.name
    `;
    try {
        const result = await pool.query(query, [req.params.class_id]);
        res.send(result.rows);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error fetching class roster');
    }
});

/* letting a teacher file an incident report; notifies every linked parent */
app.post('/incidents', async (req: any, res: any) => {
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
});

/* getting supply requests for a parent */
app.get('/supplies/:account_id', async (req: any, res: any) => {
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
});

/* ── Toilet Visit Logs ── */

/* getting toilet visits for a child */
app.get('/toilet/:child_id', async (req: any, res: any) => {
    const query = `
        SELECT
            al.id,
            al.child_id,
            al.activity_timestamp,
            al.comments,
            al.toilet_type,
            a.full_name AS recorded_by
        FROM activity_logs al
        JOIN account a ON a.id = al.account_id
        WHERE al.child_id = $1 AND al.log_type = 'toilet'
        ORDER BY al.activity_timestamp DESC
    `;
    try {
        const result = await pool.query(query, [req.params.child_id]);
        res.send(result.rows);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error fetching toilet logs');
    }
});

/* letting a teacher log a toilet visit for a child */
app.post('/toilet', async (req: any, res: any) => {
    const { account_id, child_id, toilet_type, comments } = req.body;
    const query = `
        INSERT INTO activity_logs (account_id, child_id, log_type, activity_timestamp, toilet_type, comments)
        VALUES ($1, $2, 'toilet', CURRENT_TIMESTAMP, $3, $4)
        RETURNING *
    `;
    try {
        const result = await pool.query(query, [account_id, child_id, toilet_type, comments || null]);
        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error logging toilet visit');
    }
});

/* ── Attendance ── */

/* getting attendance history for a child */
app.get('/attendance/:child_id', async (req: any, res: any) => {
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
});

/* letting a teacher check in a child */
app.post('/attendance/checkin', async (req: any, res: any) => {
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
});

/* letting a teacher check out a child */
app.put('/attendance/:id/checkout', async (req: any, res: any) => {
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
});

/* getting events/notifications for an account */
app.get('/notifications/:account_id', async (req: any, res: any) => {
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
});

/* marking a notification as seen */
app.put('/notifications/:id/seen', async (req: any, res: any) => {
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
});

/* creating a notification + sending email */
app.post('/notifications', async (req: any, res: any) => {
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
});

/* send email notification for an existing notification */
app.post('/notifications/:id/email', async (req: any, res: any) => {
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
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});
