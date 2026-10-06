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

const ROLES = ["admin", "teacher", "parent"];
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
  const { username, full_name, email, password, role } = req.body ?? {};

  if (!username?.trim() || !full_name?.trim() || !email?.trim() || !password || !role) {
    return res.status(400).send("username, full_name, email, password and role are required");
  }
  if (!ROLES.includes(role)) {
    return res.status(400).send("Invalid role");
  }

  const Current_id = req.user.Current_id;
  const client = await pool.connect();

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO account (username, full_name, email, password, role, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING id, username, full_name, email, role`,
      [username.trim(), full_name.trim(), email.trim(), hashedPassword, role, Current_id]
    );
    const account = result.rows[0];

    // create the matching row in the role table
    if (role === "parent") {
      await client.query("INSERT INTO parent (account_id) VALUES ($1)", [account.id]);
    } else if (role === "teacher") {
      await client.query("INSERT INTO teacher (account_id) VALUES ($1)", [account.id]);
    }

    await client.query("COMMIT");
    return res.status(201).json({
      message: "Account created successfully",
      account,
    });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error(err.message);
    if (err.code === "23505") {
      return res.status(409).send("Username or email already exists");
    }
    return res.status(500).send("Error creating account");
  } finally {
    client.release();
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
