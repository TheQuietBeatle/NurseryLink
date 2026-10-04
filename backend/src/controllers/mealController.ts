const pool = require("../config/DB");


// GET /meals/:child_id
/* getting meal logs for a child */
export const getMeals = async (req: any, res: any) => {
    const query = `
        SELECT
            al.id,
            al.child_id,
            al.activity_timestamp,
            al.comments,
            al.food_portion,
            al.meal_type,
            a.full_name AS teacher_name
        FROM activity_logs al
        JOIN account a ON a.id = al.account_id
        WHERE al.child_id = $1 AND al.log_type = 'meal'
        ORDER BY al.activity_timestamp DESC
    `;
    try {
        const result = await pool.query(query, [req.params.child_id]);
        res.send(result.rows);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error fetching meals');
    }
};


// POST /meals
/* letting a teacher log a meal for a child */
export const logMeal = async (req: any, res: any) => {
    const { account_id, child_id, meal_type, food_portion, comments } = req.body;
    const query = `
        INSERT INTO activity_logs (account_id, child_id, log_type, activity_timestamp, comments, food_portion, meal_type)
        VALUES ($1, $2, 'meal', CURRENT_TIMESTAMP, $3, $4, $5)
        RETURNING *
    `;
    try {
        const result = await pool.query(query, [account_id, child_id, comments || null, food_portion, meal_type]);
        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Error logging meal');
    }
};
