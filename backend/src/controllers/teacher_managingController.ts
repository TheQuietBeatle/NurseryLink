import pool from "../config/DB";

export const getTeachers = async (req:any, res:any) => {
  try {
    const { rows } = await pool.query(`SELECT a.full_name,a.email,a.is_active
        FROM account a
        where a.role='teacher' 
        order by a.full_name`);
   return res.json(rows);
  } catch (error) {
    console.error("Error fetching teachers:", error);
   return res.status(500).json({ error: "Internal server error" });
  } 
};
export const assignTeacherToClass = async (req: any, res: any) => {
  const { teacher_name, class_name } = req.body ?? {};
  // if (!teacher_name?.trim() || !class_name?.trim()) {
  //   return res.status(400).json({ error: "teacher_name and class_name are required" });
  // }

  try {
    const teacher = await pool.query(
      "SELECT id FROM account WHERE full_name = $1 AND role = 'teacher'",
      [teacher_name.trim()]
    );
    if (teacher.rows.length === 0) {
      return res.status(404).json({ error: "Active teacher not found" });
    }
    if (teacher.rows.length > 1) {
      return res.status(409).json({ error: "More than one teacher has this name" });
    }

    const cls = await pool.query(
      "SELECT id FROM class WHERE class_name = $1",
      [class_name.trim()]
    );
    if (cls.rows.length === 0) {
      return res.status(404).json({ error: "Class not found" });
    }

    await pool.query(
      "INSERT INTO teacher_class (teacher_id, class_id) VALUES ($1, $2)",
      [teacher.rows[0].id, cls.rows[0].id]
    );
    return res.status(201).json({ message: "Teacher assigned to class successfully" });
  } catch (err: any) {
    console.error(err.message);
    if (err.code === "23505") {
      return res.status(409).json({ error: "Teacher is already assigned to this class" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

// export const assignTeacherToClass = async (req:any, res:any) => {
//   const { teacher_id, class_id } = req.body;
  
//   try{
//     const result=await pool.query("INSERT INTO teacher_class (teacher_id, class_id) VALUES ($1, $2)", [teacher_id, class_id]);
//    return res.json({ message: "Teacher assigned to class successfully" });
//   } catch (error) {
//     console.error("Error assigning teacher to class:", error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// }
export const getteachersinclass = async (req:any, res:any   ) => {
  const { class_id } = req.params;
  try {
    const { rows } = await pool.query(
        `SELECT a.id, a.full_name, a.username, a.email, a.is_active
       FROM account a
       JOIN teacher_class tc ON tc.teacher_id = a.id
       WHERE tc.class_id = $1
       ORDER BY a.full_name`,
        [class_id]
    );
    return res.json(rows);
  } catch (error) {
    console.error("Error fetching teachers in class:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}   
// PUT /MoveTeacherToClass  { teacher_id, old_class_id, new_class_id }
export const moveTeacherToClass = async (req: any, res: any) => {
  const { teacher_id, old_class_id, new_class_id } = req.body ?? {};
  if (!teacher_id || !old_class_id || !new_class_id) {
    return res
      .status(400)
      .json({ error: "teacher_id, old_class_id and new_class_id are required" });
  }
  if (old_class_id === new_class_id) {
    return res.status(400).json({ error: "Classes must be different" });
  }

  try {
    // adjust this check to your teachers/account tables
    const teacher = await pool.query(
      "SELECT 1 FROM account WHERE id = $1 AND role = 'teacher' AND is_active = TRUE",
      [teacher_id]
    );
    if (teacher.rows.length === 0) {
      return res.status(404).json({ error: "Active teacher not found" });
    }

    const result = await pool.query(
      `UPDATE teacher_class
       SET class_id = $1
       WHERE teacher_id = $2 AND class_id = $3`,
      [new_class_id, teacher_id, old_class_id]
    );
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Teacher is not assigned to the old class" });
    }

    return res.json({ message: "Teacher moved to the new class successfully" });
  } catch (err: any) {
    console.error(err.message);
    if (err.code === "23505") {
      return res.status(409).json({ error: "Teacher is already assigned to the new class" });
    }
    if (err.code === "23503") {
      return res.status(404).json({ error: "New class not found" });
    }
    return res.status(500).json({ error: "Error moving teacher" });
  }
};