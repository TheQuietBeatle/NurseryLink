import pool from "../config/DB";
import { sendEmail } from "../services/mailer";
import { notifyAccounts } from "../services/notify";

const TYPES = [
  "incident",
  "supply",
  "announcement",
  "attendance",
  "activity",
  "temperature_alert",
];
const PRIORITIES = ["low", "normal", "high", "urgent"];

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// GET /api/notification/:account_id
/* getting events/notifications for an account */
export const getNotifications = async (req: any, res: any) => {
  const query = `
        SELECT
            n.id,
            an.account_id,
            n.notification_type,
            n.sent_at,
            an.seen_at,
            an.handled_at,
            an.seen,
            an.handled,
            n.description,
            n.priority
        FROM account_notification an
        JOIN notifications n ON an.notification_id = n.id
        WHERE an.account_id = $1
        ORDER BY n.sent_at DESC
    `;
  try {
    const result = await pool.query(query, [req.params.account_id]);
    res.send(result.rows);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send("Error fetching notifications");
  }
};

// PUT /notifications/:id/seen
/* marking a notification as seen */
export const markNotificationSeen = async (req: any, res: any) => {
  const query = `
        UPDATE account_notification
        SET seen = TRUE, seen_at = COALESCE(seen_at, CURRENT_TIMESTAMP)
        WHERE notification_id = $1 and account_id=$2
        RETURNING *
    `;
  try {
    const result = await pool.query(query, [req.params.id]);
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send("Error updating notification");
  }
};

// POST /notifications
/* creating a notification + sending email */
export const createNotification = async (req: any, res: any) => {
  if (req.user.role !== "admin" && req.user.role !== "teacher") {
    return res
      .status(403)
      .send("Only admins  and teachers can create notifications");
  }

  const { account_id, notification_type, description, priority } =
    req.body ?? {};
  const accountId = Number(account_id);
  const level = priority || "normal";

  if (!Number.isInteger(accountId) || !description?.trim()) {
    return res.status(400).send("account_id and description are required");
  }
  if (!TYPES.includes(notification_type)) {
    return res
      .status(400)
      .send(`notification_type must be one of: ${TYPES.join(", ")}`);
  }
  if (!PRIORITIES.includes(level)) {
    return res
      .status(400)
      .send(`priority must be one of: ${PRIORITIES.join(", ")}`);
  }

  try {
    const account = await pool.query(
      "SELECT email, full_name FROM account WHERE id = $1 AND is_active = TRUE",
      [accountId],
    );
    if (account.rows.length === 0) {
      return res.status(404).send("Account not found");
    }
    if (req.user.role == "teacher") {
      const allowed = await pool.query(
        `SELECT 1
     FROM parent p
     JOIN child_parent cp ON cp.parent_id = p.id
     JOIN child c ON c.id = cp.child_id
     JOIN teacher_class tc ON tc.class_id = c.class_id
     JOIN teacher t ON t.id = tc.teacher_id
     WHERE p.account_id = $1 AND t.account_id = $2
     LIMIT 1`,
        [accountId, req.user.Current_id],
      );
      if (allowed.rows.length === 0) {
        return res
          .status(403)
          .send("You can only notify parents of children in your classes");
      }
    }

    const notification = await notifyAccounts(
      [accountId],
      notification_type,
      description.trim(),
      level,
    );
    res.status(201).json({ ...notification, account_id: accountId });

    // email goes out after the response; a failure here must not change it
    const { email, full_name } = account.rows[0];
    const label =
      level === "urgent" ? "URGENT" : level === "high" ? "Important" : "";
    const type = notification_type.replace(/_/g, " ");
    sendEmail(
      email,
      label ? `${label}: ${type}` : type,
      `<h2>NurseryLink Notification</h2>
       <p>Dear ${escapeHtml(full_name)},</p>
       <p>${escapeHtml(description.trim())}</p>
       ${level === "urgent" ? '<p style="color:red;font-weight:bold;">This requires your immediate attention.</p>' : ""}
       <p>— NurseryLink</p>`,
    ).catch((e: any) => console.error("Email send failed:", e.message));
  } catch (err: any) {
    console.error(err.message);
    if (!res.headersSent) {
      return res.status(500).send("Error creating notification");
    }
  }
};

// POST /notifications/:id/email
/* send email notification for an existing notification */
export const emailNotification = async (req: any, res: any) => {
  try {
    const notif = await pool.query(
      `
            SELECT n.*, a.email, a.full_name
            FROM notifications n
            JOIN account_notification an ON an.notification_id = n.id
            JOIN account a ON a.id = an.account_id
            WHERE n.id = $1
        `,
      [req.params.id],
    );
    if (notif.rows.length === 0)
      return res.status(404).send("Notification not found");

    const { email, full_name, notification_type, description, priority } =
      notif.rows[0];
    const priorityLabel =
      priority === "urgent" ? "URGENT" : priority === "high" ? "Important" : "";
    const subject = priorityLabel
      ? `${priorityLabel}: ${notification_type.replace(/_/g, " ")}`
      : notification_type.replace(/_/g, " ");
    await sendEmail(
      email,
      subject,
      `<h2>NurseryLink Notification</h2>
             <p>Dear ${full_name},</p>
             <p>${description}</p>
             ${priority === "urgent" ? '<p style="color:red;font-weight:bold;">This requires your immediate attention.</p>' : ""}
             <p>— NurseryLink</p>`,
    );
    res.json({ success: true });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send("Error sending email");
  }
};
