const pool = require('./db');
const { sendEmail } = require('./mailer');

async function sendAllEmails() {
  try {
    const result = await pool.query(`
      SELECT n.*, a.email, a.full_name
      FROM notifications n
      JOIN account a ON a.id = n.account_id
      WHERE n.account_id = 41
      ORDER BY n.sent_at DESC
    `);

    console.log(`Found ${result.rows.length} notifications for George. Sending emails...\n`);

    for (const notif of result.rows) {
      const { email, full_name, notification_type, description, priority, sent_at } = notif;
      const priorityLabel = priority === 'urgent' ? 'URGENT' : priority === 'high' ? 'Important' : '';
      const subject = priorityLabel
        ? `${priorityLabel}: ${notification_type.replace(/_/g, ' ')}`
        : notification_type.replace(/_/g, ' ');

      try {
        const res = await sendEmail(
          email,
          subject,
          `<h2>NurseryLink Notification</h2>
           <p>Dear ${full_name},</p>
           <p>${description}</p>
           <p><small>Sent: ${new Date(sent_at).toLocaleString()}</small></p>
           ${priority === 'urgent' ? '<p style="color:red;font-weight:bold;">This requires your immediate attention.</p>' : ''}
           <p>— NurseryLink</p>`
        );
        console.log(`  [OK] ${notification_type} (id:${notif.id}) -> ${email} (resend id: ${res.id})`);
      } catch (e) {
        console.error(`  [FAIL] ${notification_type} (id:${notif.id}): ${e.message}`);
      }
    }

    console.log('\nDone!');
  } finally {
    await pool.end();
  }
}

sendAllEmails();
