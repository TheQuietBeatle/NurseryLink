import pool from "../config/DB";


// GET /getchildren
export const getChildren = async (req: any, res: any) => {

  const query = "SELECT * FROM child";

  try {
    const result = await pool.query(query);

    res.send(result.rows);
  } catch (err: any) {
    console.error(err.message);

    res.status(500).send("Error getting children");
  }
};


// POST /AddChild
export const addChild = async (req: any, res: any) => {

  const {
    name,
    date_of_birth,
    class_name,
    summary_log,
    enrolled_at,
  } = req.body;

  const class_id = await pool.query(
    "SELECT id FROM class WHERE class_name = $1",
    [class_name]
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
};