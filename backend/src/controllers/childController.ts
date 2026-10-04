import pool from "../config/DB";


// GET /getchildren
export const getChildren = async (req: any, res: any) => {

  const query = "SELECT * FROM child";

  try {
    const result = await pool.query(query);

    return res.send(result.rows);
  } catch (err: any) {
    console.error(err.message);

    return res.status(500).send("Error getting children");
  }
};


// POST /AddChild
export const addChild = async (req: any, res: any) => {

  const {
    name,
    date_of_birth,
    class_name,
    summary_log,
  } = req.body;
    if (!name?.trim() || !date_of_birth || !class_name) {
    return res.status(400).send("name, date_of_birth and class_name are required");
  }
try{
  const class_id = await pool.query(
    "SELECT id FROM class WHERE class_name = $1",
    [class_name]
  );

  if (class_id.rows.length === 0) {
    return res.status(400).send("Class not found");
    return;
  }

  const result = await pool.query(
    "INSERT INTO child (class_id,name,date_of_birth,summary_log,enrolled_at) VALUES ($1,$2,$3,$4,CURRENT_TIMESTAMP) returning id",
  [class_id.rows[0].id, name, date_of_birth, summary_log??null]
  );
  return res.status(201).send
  ({message: "Child added successfully",
  "student-code": result.rows[0].id,
   });
}

   catch (err: any) {
    console.error(err.message);

    return res.status(500).send("Error adding child");
  }
};
export const searchforchild = async (req: any, res: any) => {
  const { name } = req.query; 
  const query = "SELECT * FROM child WHERE name ILIKE $1";
  try {
    const result = await pool.query(query, [`%${name}%`]);
    return res.send(result.rows);
  } catch (err: any) {
    console.error(err.message);
    return res.status(500).send("Error searching for children");
  }
};

// export const assignchildtoClass = async (req: any, res: any) => {
//   const { child_id, class_name } = req.body;

//   const class_id = await pool.query(
//     "SELECT id FROM class WHERE class_name = $1",
//     [class_name]
//   );
//   const query="insert into child_class (child_id,class_id,assigned_at) values ($1,$2,CURRENT_TIMESTAMP)";
//   if (class_id.rows.length === 0) {
//     res.status(400).send("Class not found");
//     return;
//   }
//   try {
//     const result = await pool.query(query, [child_id, class_id.rows[0].id]);
//     return res.send("Child assigned to class successfully");
//   } catch (err: any) {
//     console.error(err.message);
//     return res.status(500).send("Error assigning child to class");
//   }
// }

export const deleteChild = async (req: any, res: any) => {
  const { child_id } = req.params;

  const query = "DELETE FROM child WHERE id = $1";

  try {
    const result = await pool.query(query, [child_id]);

    if (result.rowCount === 0) {
      return res.status(404).send("Child not found");
    }

    return res.send("Child deleted successfully");
  } catch (err: any) {
    console.error(err.message);
    return res.status(500).send("Error deleting child");
  }
};
export const transferChildToClass = async (req: any, res: any) => {
  const { child_id, new_class_name } = req.body;
  if(!child_id || !new_class_name?.trim()){
    return res.status(400).send("child_id and new_class_name are required");
  }
  try{
  const class_id = await pool.query(
    "SELECT id FROM class WHERE class_name = $1",
    [new_class_name]
  );  
  const new_class_id = class_id.rows[0]?.id;
  const child=await pool.query("select class_id from child where id=$1 ",[child_id]);
  if(child.rows.length===0){
    return res.status(404).send("Child not found or inactive");
  }
  if(new_class_id===child.rows[0].class_id){
    return res.status(400).send("Child is already in the specified class");
  }
  await pool.query("update child set class_id=$1 where id=$2",[new_class_id,child_id]);
  return res.status(200).send("Child transferred successfully");
  }
  catch (err: any) {
    console.error(err.message);
    return res.status(500).send("Error transferring child to class");
  }

}


// GET /children/account/:account_id
/* get all children linked to a parent's account (covers both parents in a family) */
export const getChildrenByAccount = async (req: any, res: any) => {
    const query = `
        SELECT c.* FROM child c
        JOIN child_parent cp ON cp.child_id = c.id
        JOIN parent p ON p.id = cp.parent_id
        WHERE p.account_id = $1
    `;
    const result = await pool.query(query, [req.params.account_id]);
    res.send(result.rows);
};
