require("dotenv").config();
const express = require("express");
import jwt from "jsonwebtoken";
const cors = require("cors");
const pool = require("./db");
import { sendEmail } from "./mailer";
const app = express();
//middleware
app.use(cors());
app.use(express.json()); //req.body

// 3shan ageeb mktba mn el nodemodules
import bcrypt from "bcrypt";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET is not set in the environment");
}

app.use(express.json());

///////////lets start

//add login route //for the default admin account
app.post("/Login", async (req: any, res: any) => {
  const { email, password } = req.body;
  try {
    const query = "SELECT * FROM account WHERE email = $1";
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(401).send("Invalid credentials");
    }
    const stored_hashedPassword = result.rows[0]?.password; // Get the hashed password from the database

    //  const passwordMatch = await bcrypt.compare(password, stored_hashedPassword);

    const passwordMatch = await bcrypt.compare(password, stored_hashedPassword);
    // const query = 'SELECT * FROM account WHERE email = $1 AND password = $2';

    // it takes the plain text password from the user and compares it with the hashed password stored in the database using bcrypt.compare function. If the passwords match, it returns the user information, otherwise it returns an error message.

    if (!passwordMatch) {
      console.log("Invalid credentials");
      return res.status(401).send("Invalid credentials");
    }
    // 7. Create the JWT
    const token = jwt.sign(
      {
        Current_id: result.rows[0].id,
        email: result.rows[0].email,
        role: result.rows[0].role,
      },
      jwtSecret,
      {
        expiresIn: "1h",
      },
    );

    // 8. Send the token to the frontend
    return res.json({
      message: "Login successful",
      token: token,
      account: {  id: result.rows[0].id, username: result.rows[0].username, full_name: result.rows[0].full_name, email: result.rows[0].email, role: result.rows[0].role } 
    });
  } catch (err: any) {
     console.log("nana", err.message);
    return res.status(500).send("Error logging in");
  }
});
const verifyToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;

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

app.post("/CreateAccount", verifyToken, async (req: any, res: any) => {
  const { username, full_name, email, password, role } = req.body;
  //hash password
  const Current_id = req.user.Current_id; // Get the ID of the currently logged-in admin from the decoded token
  const hashedPassword = await bcrypt.hash(password, 10);
  // salt rounds = 10 :)
  const query =
    "INSERT INTO account (username, full_name, email, password, role,created_by,created_at) VALUES ($1, $2, $3, $4, $5,$6,CURRENT_TIMESTAMP) RETURNING id,username,full_name,email,role";
  const values = [username, full_name, email, hashedPassword, role, Current_id];
  try {
    const result = await pool.query(query, values);
    // res.send('Account created successfully');
    return res.json({
      message: "Account created successfully",
      account: result.rows[0],
    });
  } catch (err: any) {
    console.error(err.message);
    return res.status(500).send("Error creating account");
  }
  //created by:id of currently logged in admin
});

// app.post("/CreatePriviledge",verifyToken, async (req: any, res: any) => {
//   const { description, created_at } = req.body;

//   const query =
//     "INSERT INTO priviliedge (description,created_at) VALUES ($1,$2)";
//   const values = [description, created_at];
//   try {
//     const result = await pool.query(query, values);
//     res.send("Priviledge created successfully");
//   } catch (err: any) {
//     console.error(err.message);
//     res.status(500).send("Error creating priviledge");
//   }
// });

//here i need to check the verification of the token 


// xxxx xx  x x modified later to make it only for the default admin 
app.get("/checkCurrentPriviledge/:id", verifyToken, async (req: any, res: any) => {
    const current_role=req.user.role; // Get the ID of the currently logged-in admin from the decoded token
if(current_role!=='admin'){
    return res.status(403).send("You are not authorized to view this information");
}
  const query = "select *from admin_previlledge where account_id=$1";

  try {
    const result = await pool.query(query, [req.params.id]);
    res.send(result.rows);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send("Error getting priviledges");
  }
});
app.get("/GetPriviledges", async (req: any, res: any) => {
  const query = "SELECT * FROM priviliedge";
  try {
    const result = await pool.query(query);
    res.send(result.rows);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send("Error getting priviledges");
  }
});
app.get("/GetPriviledge/:id", verifyToken, async (req: any, res: any) => {
  const query = "SELECT * FROM priviliedge WHERE id=$1";
  try {
    const result = await pool.query(query, [req.params.id]);
    res.send(result.rows);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send("Error getting priviledge");
  }
});



app.post("/AssignPriviledge", verifyToken, async (req: any, res: any) => {
  const { account_id, priviledge_ids } = req.body;

  if (!account_id || !Array.isArray(priviledge_ids)) {
    return res.status(400).json({
      message: "account_id and priviledge_ids are required",
    });
  }
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const current_admin_id = req.user.Current_id; // Get the ID of the currently logged-in admin
    //     const result=await pool.query(query,values);
    //    return res.send('Priviledge assigned successfully');
    const checkQuery =
      "select privilege_id from admin_previlledge where account_id=$1 and privilege_id=ANY($2::int[])";
    const checkresult = await client.query(checkQuery, [
      current_admin_id,
      priviledge_ids,
    ]);
    if (checkresult.rows.length != priviledge_ids.length) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        message: "You are not authorized to assign this priviledge",
      });
    }
    // Remove privileges that were unchecked
    await client.query(
      `
            DELETE FROM admin_previlledge
            WHERE account_id = $1
              AND privilege_id <> ALL($2::bigint[])
            `,
      [account_id, priviledge_ids],
    );
    for (const priviledgeId of priviledge_ids) {
      await client.query(
        `INSERT INTO admin_previlledge
                 (account_id, privilege_id)
                 VALUES ($1, $2)`,
        [account_id, priviledgeId],
      );
    }

    await client.query('COMMIT');

        return res.status(200).json({
            message: 'Privileges updated successfully'
        });

    } catch (err: any) {

        await client.query('ROLLBACK');

        console.error(err.message);

        return res.status(500).json({
            message: 'Error updating privileges'
        });

    } finally {
        client.release();
    }
});

//////2nd admin functionalityyyyyyyyyyy...........

app.post("/CreateClass", async (req: any, res: any) => {
  const { class_name, subjects } = req.body;
  const query =
    "INSERT INTO class (class_name,subjects,created_at,updated_at) VALUES ($1,$2,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)";
  const values = [class_name, subjects];
  try {
    const result = await pool.query(query, values);
    res.send("Class created successfully");
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send("Error creating class");
  }
});
app.get("/GetClasses", async (req: any, res: any) => {
  const query = "SELECT * FROM class";
  try {
    const result = await pool.query(query);
    res.send(result.rows);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send("Error getting classes");
  }
});

app.post("/AddChild", async (req: any, res: any) => {
  const { name, date_of_birth, class_name, summary_log, enrolled_at } =
    req.body;
  const class_id = await pool.query(
    "SELECT id FROM class WHERE class_name = $1",
    [class_name],
  );
  if (class_id.rows.length === 0) {
    res.status(400).send("Class not found");
    return;
  }

  const query =
    "INSERT INTO child (class_id,name,date_of_birth,summary_log,enrolled_at) VALUES ($1,$2,$3,$4,CURRENT_TIMESTAMP)";
  const values = [
    class_id.rows[0].id,
    name,
    date_of_birth,
    summary_log,
    CURRENT_TIMESTAMP,
  ];
  try {
    const result = await pool.query(query, values);
    res.send("Child added successfully");
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send("Error adding child");
  }
});

//3rd admin functionalityyyyyyyyyyy...........
app.post("/CreateTeacher", async (req: any, res: any) => {});

//get all accounts with role //
app.get("/account/role/:role", async (req: any, res: any) => {
  const query = "SELECT * FROM account WHERE role = $1";
  try {
    const result = await pool.query(query, [req.params.role]);
   return res.send(result.rows);
  } catch (err: any) {
    console.error(err.message);
   return res.status(500).send("Error getting accounts with role=$1");
  }
});
//get an account //
app.get("/account/id/:id", async (req: any, res: any) => {
  const query = "SELECT * FROM account WHERE id = $1";
  try {
    const result = await pool.query(query, [req.params.id]);
    res.send(result.rows);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send("Error getting account with id=$1");
  }
});

// //update an account //
// app.put('/account/:id', async (req: any, res: any) => {
//     const { username, full_name, email, password, role } = req.body;
//     const query = 'UPDATE account SET username = $1, full_name = $2, email = $3, password = $4, role = $5 WHERE id = $6';
//     const values = [username, full_name, email, password, role, req.params.id];
//     try {
//         const result = await pool.query(query, values);
//         res.send('Account updated successfully');
//         await sendEmail(
//             email,
//             "Account Info Changed",
//             `<h2>Your Account Information Has Been Changed Successfully</h2>
//              <p><strong>Email:</strong> ${email}</p>
//              <p><strong>Password:</strong> ${password}</p>
//              <p>If you did not make this change, please contact support immediately.</p>`
//         );
//     } catch (err: any) {
//         console.error(err.message);
//         res.status(500).send('Error updating account');
//     }
// });

//delete an account //
app.delete("/account/:id", async (req: any, res: any) => {
  const query = "DELETE FROM account WHERE id = $1";
  const result = await pool.query(query, [req.params.id]);
  res.send("Account deleted successfully");
});

app.listen(3000, () => {
  console.log("server has started on port 3000");
});
