// services/notify.ts
import pool from "../config/DB";
export const notifyAccounts = async (
  accountIds: number[],
  type: string,
  description: string,
  priority = "normal"
) => {
  const ids = [...new Set(accountIds)];        // the same account can't receive it twice
  if (ids.length === 0) return null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const n = await client.query(
      `INSERT INTO notifications (notification_type, description, priority)
       VALUES ($1, $2, $3)
       RETURNING id, notification_type, description, priority, sent_at`,
      [type, description, priority]
    );

    await client.query(
      `INSERT INTO account_notification (account_id, notification_id)
       SELECT unnest($1::bigint[]), $2`,
      [ids, n.rows[0].id]
    );

    await client.query("COMMIT");
    return n.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};