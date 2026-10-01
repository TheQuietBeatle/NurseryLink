import "dotenv/config";
import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set in the environment");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, message: string) {
    return resend.emails.send({
        from: "NurseryLink <onboarding@resend.dev>",
        to: [to],
        subject: `NurseryLink : ${subject}`,
        html: `<p>${message}</p>`,
    });
}
