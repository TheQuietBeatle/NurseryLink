const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");
import { sendEmail } from "./mailer";

//middleware
app.use(cors());
app.use(express.json()); //req.body


//routes //
//create account//

app.post('/account', async (req: any, res: any) => {
    const { username, full_name, email, password, role } = req.body;
    const query = 'INSERT INTO account (username, full_name, email, password, role) VALUES ($1, $2, $3, $4, $5)';
    const values = [username, full_name, email, password, role];
    try {
        const result = await pool.query(query, values);
        res.send('Account created successfully');
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error creating account');
    }
});

/*
{
  "username": "george2",
  "full_name": "George Sameh",
  "email": "george2@example.com",
  "password": "pw123",
  "role": "parent"
}
 */
//get all accounts with role //
app.get('/account/role/:role', async (req: any, res: any) => {
    const query = 'SELECT * FROM account WHERE role = $1';
    const result = await pool.query(query, [req.params.role]);
    res.send(result.rows);
})
//get an account //
app.get('/account/id/:id', async (req: any, res: any) => {
    const query = 'SELECT * FROM account WHERE id = $1';
    const result = await pool.query(query, [req.params.id]);
    res.send(result.rows);
});

//update an account //
app.put('/account/:id', async (req: any, res: any) => {
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
});


//delete an account //
app.delete('/account/:id', async (req: any, res: any) => {
    const query = 'DELETE FROM account WHERE id = $1';
    const result = await pool.query(query, [req.params.id]);
    res.send('Account deleted successfully');
});
//login //

//add login route //
app.post('/Login', async (req: any, res: any) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM account WHERE email = $1 AND password = $2';
    const result = await pool.query(query, [email, password]);
    if (result.rows.length === 0) {
        res.status(401).send('Invalid credentials');
    }
    else if (result.rows.length === 1) {
        res.json({
            id: result.rows[0].id,
            full_name: result.rows[0].full_name,
            email: result.rows[0].email,
            role: result.rows[0].role,
        });
    }
    else {
        res.status(500).send('Error logging in');
    }
});

/* get all children linked to a parent's account (covers both parents in a family) */
app.get('/children/account/:account_id', async (req: any, res: any) => {
    const query = `
        SELECT c.* FROM child c
        JOIN child_parent cp ON cp.child_id = c.id
        JOIN parent p ON p.id = cp.parent_id
        WHERE p.account_id = $1
    `;
    const result = await pool.query(query, [req.params.account_id]);
    res.send(result.rows);
})

app.get('/', (req: any, res: any) => {
    res.send('Hello World!');
});

app.post('/test-email', async (req: any, res: any) => {
    const { to } = req.body;
    try {
        const result = await sendEmail(to, "Test Email", "<h1>Test Email</h1>");
        res.json(result);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error sending email');
    }
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});
