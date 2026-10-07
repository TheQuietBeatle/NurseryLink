import { sendEmail } from "../services/mailer";
import pool from "../config/DB";

// POST /test-email
export const sendTestEmail = async (req: any, res: any) => {
    const { to } = req.body;
    try {
        const result = await sendEmail(to, "Test Email", "<h1>Test Email</h1>");
        res.json(result);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error sending email');
    }
};
