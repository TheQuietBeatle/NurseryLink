const jwtSecret = process.env.JWT_SECRET;
import jwt from "jsonwebtoken";
if (!jwtSecret) {
  throw new Error("JWT_SECRET is not set in the environment");
}

const verifyToken = (req: any, res: any, next: any) => {
  
  const authHeader = req.headers.authorization;
console.log("auth header:", req.headers.authorization);
console.log("all headers:", req.headers);
  if (!authHeader) {
    return res.status(401).send("No token provided");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, jwtSecret);

    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).send("Invalid or expired token");
  }
};

export default verifyToken;
