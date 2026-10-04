import pool from "../config/DB";


// POST /CreateClass

export const createClass = async (req: any, res: any) => {
  const { class_name, subjects } = req.body;
try {
  const query =
    "INSERT INTO class (class_name,subjects,created_at,updated_at) VALUES ($1,$2,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)";

  const values = [class_name, subjects];
    const result = await pool.query(query, values);
    return res.send("Class created successfully");
  } catch (err: any) {
    console.error(err.message);

    return res.status(500).send("Error creating class");
  }
};


// GET /GetClasses
export const getClasses = async (req: any, res: any) => {

  const query = "SELECT * FROM class";

  try {
    const result = await pool.query(query);

    return res.send(result.rows);
  } catch (err: any) {
    console.error(err.message);

    return res.status(500).send("Error getting classes");
  }
};