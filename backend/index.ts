const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");

//middleware
app.use(cors());
app.use(express.json()); //req.body


//routes //
//create account//

app.post('/account', async (req:any, res:any) => {
    const { username, full_name, email, password, role } = req.body;
    const query = 'INSERT INTO account (username, full_name, email, password, role) VALUES ($1, $2, $3, $4, $5)';
    const values = [username, full_name, email, password, role];
    try {
        const result = await pool.query(query, values);
        res.send('Account created successfully');
    } catch (err : any) {
        console.error(err.message);
        res.status(500).send('Error creating account');
    }
});
//get all accounts //
//get an account //
//update an account //
//delete an account //
//login //



app.get('/', (req:any, res:any) => {
    res.send('Hello World!');
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});
