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

// GET /class/:class_id/roster
/* getting today's roster for a class: each child plus their latest activity today */
export const getClassRoster = async (req: any, res: any) => {
  const query = `
        SELECT
            c.id,
            c.name,
            c.date_of_birth,
            att.check_in_time,
            att.check_out_time,
            temp.degree_celsius AS last_temp,
            temp.activity_timestamp AS last_temp_at,
            meal.meal_type AS last_meal_type,
            meal.food_portion AS last_meal_portion,
            meal.activity_timestamp AS last_meal_at,
            COALESCE(meals.meals_today, '[]'::json) AS meals_today,
            toilet.activity_timestamp AS last_toilet_at
        FROM child c
        LEFT JOIN LATERAL (
            SELECT check_in_time, check_out_time FROM attendance_records
            WHERE child_id = c.id AND check_in_time::date = CURRENT_DATE
            ORDER BY check_in_time DESC LIMIT 1
        ) att ON true
       LEFT JOIN LATERAL (
    SELECT (log_details->>'degree_celsius')::float8 AS degree_celsius, activity_timestamp
    FROM activity_logs
    WHERE child_id = c.id AND log_type = 'temperature' AND activity_timestamp::date = CURRENT_DATE
    ORDER BY activity_timestamp DESC LIMIT 1
) temp ON true
LEFT JOIN LATERAL (
    SELECT log_details->>'meal_type'    AS meal_type,
           log_details->>'food_portion' AS food_portion,
           activity_timestamp
    FROM activity_logs
    WHERE child_id = c.id AND log_type = 'meal' AND activity_timestamp::date = CURRENT_DATE
    ORDER BY activity_timestamp DESC LIMIT 1
) meal ON true
LEFT JOIN LATERAL (
    SELECT json_agg(
        json_build_object(
            'meal_type', log_details->>'meal_type',
            'food_portion', log_details->>'food_portion',
            'activity_timestamp', activity_timestamp
        ) ORDER BY activity_timestamp DESC
    ) AS meals_today
    FROM activity_logs
    WHERE child_id = c.id AND log_type = 'meal' AND activity_timestamp::date = CURRENT_DATE
) meals ON true
        LEFT JOIN LATERAL (
            SELECT activity_timestamp FROM activity_logs
            WHERE child_id = c.id AND log_type = 'toilet' AND activity_timestamp::date = CURRENT_DATE
            ORDER BY activity_timestamp DESC LIMIT 1
        ) toilet ON true
        WHERE c.class_id = $1
        ORDER BY c.name
    `;
  try {
    const result = await pool.query(query, [req.params.class_id]);
    res.send(result.rows);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send("Error fetching class roster");
  }
};
