import "dotenv/config";
export const jwtSecret = process.env.JWT_SECRET;
if(!jwtSecret) {
    throw new Error("JWT_SECRET is not set in the environment");
}
export const resendApiKey = process.env.RESEND_API_KEY;
if(!resendApiKey) {
    throw new Error("RESEND_API_KEY is not set in the environment");
}