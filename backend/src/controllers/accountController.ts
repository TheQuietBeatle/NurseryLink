// These functions come from:

// /Login
// /CreateAccount
// /account/role/:role
// /account/id/:id
// /account/:id
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/DB";
import { sendEmail } from "../services/mailer";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET is not set in the environment");
}


// POST /Login
export const login = async (req: any, res: any) => {
  const { email, password } = req.body;

  try {
    const query = "SELECT * FROM account WHERE email = $1";
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(401).send("Invalid credentials");
    }

    const stored_hashedPassword = result.rows[0]?.password;

    const passwordMatch = await bcrypt.compare(
      password,
      stored_hashedPassword
    );

    if (!passwordMatch) {
      console.log("Invalid credentials");
      return res.status(401).send("Invalid credentials");
    }

    const token = jwt.sign(
      {
        Current_id: result.rows[0].id,
        email: result.rows[0].email,
        role: result.rows[0].role,
      },
      jwtSecret,
      {
        expiresIn: "1h",
      }
    );

    return res.json({
      message: "Login successful",
      token: token,
      account: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        full_name: result.rows[0].full_name,
        email: result.rows[0].email,
        role: result.rows[0].role,
      },
    });
  } catch (err: any) {
    console.log("nana", err.message);
    return res.status(500).send("Error logging in");
  }
};


// POST /CreateAccount
export const createAccount = async (req: any, res: any) => {
  const { username, full_name, email, password, role } = req.body;

  const Current_id = req.user.Current_id;

  const hashedPassword = await bcrypt.hash(password, 10);

  const query =
    "INSERT INTO account (username, full_name, email, password, role,created_by,created_at) VALUES ($1, $2, $3, $4, $5,$6,CURRENT_TIMESTAMP) RETURNING id,username,full_name,email,role";

  const values = [
    username,
    full_name,
    email,
    hashedPassword,
    role,
    Current_id,
  ];

  try {
    const result = await pool.query(query, values);

    return res.json({
      message: "Account created successfully",
      account: result.rows[0],
    });
  } catch (err: any) {
    console.error(err.message);
    return res.status(500).send("Error creating account");
  }
};


// GET /account/role/:role
export const getAccountsByRole = async (req: any, res: any) => {
  const query = "SELECT * FROM account WHERE role = $1";

  try {
    const result = await pool.query(query, [req.params.role]);

    return res.send(result.rows);
  } catch (err: any) {
    console.error(err.message);

    return res.status(500).send("Error getting accounts with role=$1");
  }
};


// GET /account/id/:id
export const getAccountById = async (req: any, res: any) => {
  const query = "SELECT * FROM account WHERE id = $1";

  try {
    const result = await pool.query(query, [req.params.id]);

    res.send(result.rows);
  } catch (err: any) {
    console.error(err.message);

    res.status(500).send("Error getting account with id=$1");
  }
};


// DELETE /account/:id
export const deleteAccount = async (req: any, res: any) => {
  const query = "DELETE FROM account WHERE id = $1";

  const result = await pool.query(query, [req.params.id]);

  res.send("Account deleted successfully");
};


// PUT /account/:id
//update an account //
export const updateAccount = async (req: any, res: any) => {
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
};
