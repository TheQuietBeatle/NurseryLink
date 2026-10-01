import pool from "../config/DB";


// POST /CreateClass
export const createClass = async (req: any, res: any) => {

  const { class_name, subjects } = req.body;

  const current_admin_id = req.user.Current_id;

  try {

    const response = await fetch("/check-privilege", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        privilege_id: 2,
      }),
    });

    if (!response.ok) {
      throw new Error("You are not authorized to create a class");
    }

    console.log("welcome to create class page");

  } catch (err: any) {
    console.error("Error checking privilege:", err.message);
  }

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
};


// GET /GetClasses
export const getClasses = async (req: any, res: any) => {

  const query = "SELECT * FROM class";

  try {
    const result = await pool.query(query);

    res.send(result.rows);
  } catch (err: any) {
    console.error(err.message);

    res.status(500).send("Error getting classes");
  }
};