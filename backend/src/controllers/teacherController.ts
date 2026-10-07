import pool from "../config/DB";


// GET /api/teacher/account/:account_id
/* getting the teacher record (and assigned class) for an account */
export const getTeacherByAccount = async (req: any, res: any) => {
    const query = `
        SELECT t.id, t.account_id, tc.class_id, c.class_name
        FROM teacher t
        JOIN teacher_class tc ON tc.teacher_id = t.id
        JOIN class c ON c.id = tc.class_id
        WHERE t.account_id = $1
        LIMIT 1
    `;
    try {
        const result = await pool.query(query, [req.params.account_id]);
        res.send(result.rows[0] ?? null);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error fetching teacher');
    }
};

export const getTeacherClasses=async (req: any, res: any) => {
  const query = `
    SELECT c.id, c.class_name
    FROM class c
    JOIN teacher_class tc ON tc.class_id = c.id
    WHERE tc.teacher_id = $1
    order by c.id
    `;
    try {
      const result = await pool.query(query, [req.params.teacher_id]);
      res.send(result.rows);
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Error fetching teacher classes');
    }
  };