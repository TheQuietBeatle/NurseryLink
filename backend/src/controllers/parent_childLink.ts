import pool from "../config/DB";

export const getParents=async(req:any,res:any)=>{
    try{
        const {rows}=await pool.query(`
  SELECT a.id, a.full_name, a.username, a.email, a.is_active,
         COALESCE(
           json_agg(json_build_object('id', c.id, 'name', c.name) ORDER BY c.name)
             FILTER (WHERE c.id IS NOT NULL),
           '[]'
         ) AS children
  FROM account a
  JOIN parent p ON p.account_id = a.id
  LEFT JOIN child_parent cp ON cp.parent_id = p.id
  LEFT JOIN child c ON c.id = cp.child_id
  WHERE a.role = 'parent'
  GROUP BY a.id
  ORDER BY a.full_name `);
   return res.status(200).json({parents:rows});

    }
    catch(err:any)
    {
        console.error("Error fetching teachers:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}
export const assignParentToChild=async(req:any,res:any)=>{
    const{parent_name,child_name}=req.body??{};
    try{

    const parent_id=await pool.query("SELECT p.id FROM parent p join account a on p.account_id = a.id WHERE a.full_name=$1",[parent_name.trim()]);
    console.log("Parent ID Query Result:", parent_id.rows,parent_name.trim());
    if(parent_id.rows.length===0)
    {
        return res.status(404).json({error:"Active parent not found"});
    }
    const child_id=await pool.query("SELECT id FROM child WHERE name=$1",[child_name.trim()]);
    console.log("Child ID Query Result:", child_id.rows);
    if(child_id.rows.length===0)
    {
        return res.status(404).json({error:"Active child not found"});
    }
    const parent_linkage=await pool.query(`insert into child_parent(child_id,parent_id) values($1,$2)` ,[child_id.rows[0].id,parent_id.rows[0].id]);
    return res.status(200).json({message:"Parent assigned to child successfully",parent_linkage:parent_linkage.rows});
}
catch(err:any){
     console.error(err.message);
    if (err.code === "23505") {
      return res.status(409).json({ error: "This parent is already linked to this child" });
    }
    if (err.code === "23503") {
      return res.status(404).json({ error: "Child not found" });
    }
    return res.status(500).json({ error: "Internal server error" });
}
}
// export const assignParentToChild = async (req: any, res: any) => {
//   const { parent_id, child_id } = req.body ?? {};
//   if (!parent_id || !child_id) {
//     return res.status(400).json({ error: "parent_id and child_id are required" });
//   }
//   try {
//     const parent = await pool.query(
//       "SELECT 1 FROM parent WHERE id = $1",
//       [parent_id]
//     );
//     if (parent.rows.length === 0) {
//       return res.status(404).json({ error: "Active parent not found" });
//     }
//     const child = await pool.query("SELECT 1 FROM child WHERE id = $1", [child_id]);
//     if (child.rows.length === 0) {
//       return res.status(404).json({ error: "Child not found" });
//     }

//     await pool.query(
//       "INSERT INTO child_parent (child_id, parent_id) VALUES ($1, $2)",
//       [child_id, parent_id]
//     );
//     return res.status(201).json({ message: "Parent assigned to child successfully" });
//   } catch (err: any) {
//     console.error(err.message);
//     if (err.code === "23505") {
//       return res.status(409).json({ error: "This parent is already linked to this child" });
//     }
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };
export const removeParentLinkage=async(req:any,res:any)=>{
   const{parent_name,child_name}=req.body??{};
    try{

    const parent_id=await pool.query("SELECT p.id FROM parent p join account a on p.account_id = a.id WHERE a.full_name=$1",[parent_name.trim()]);
    console.log("Parent ID Query Result:", parent_id.rows,parent_name.trim());
    if(parent_id.rows.length===0)
    {
        return res.status(404).json({error:"Active parent not found"});
    }
    const child_id=await pool.query("SELECT id FROM child WHERE name=$1",[child_name.trim()]);
    console.log("Child ID Query Result:", child_id.rows);
    if(child_id.rows.length===0)
    {
        return res.status(404).json({error:"Active child not found"});
    }
    const verified_rows=await pool.query(`SELECT * from child_parent where child_id=$1 and parent_id=$2` ,[child_id.rows[0].id,parent_id.rows[0].id]);
    if(verified_rows.rows.length===0)
    {
        return res.status(404).json({error:"No linkage found between the specified parent and child"});
    }

    const delete_parent_linkage=await pool.query(`DELETE from child_parent where child_id=$1 and parent_id=$2` ,[child_id.rows[0].id,parent_id.rows[0].id]);
    return res.status(200).json({message:"Parent linkage removed successfully",delete_parent_linkage:delete_parent_linkage.rows});
}
catch(err:any){
     console.error(err.message);
   if (err.code === "23505") {
      return res.status(409).json({ error: "This parent is already linked to this child" });
    }
    if (err.code === "23503") {
      return res.status(404).json({ error: "Child not found" });
    }
    return res.status(500).json({ error: "Internal server error" });
}
}


