// these functions come from:

// /checkCurrentPriviledge/:id
// /GetPriviledges
// /GetPriviledge/:id
// /check-privilege
// /AssignPrivilege
import pool from "../config/DB";

// GET /checkCurrentPriviledge/:id
export const checkCurrentPrivilege = async (req: any, res: any) => {

  const current_role = req.user.role;

  if (current_role !== "admin") {
    return res
      .status(403)
      .send("You are not authorized to view this information");
  }

  const query =
    "select *from admin_previlledge where account_id=$1";

  try {
    const result = await pool.query(query, [req.params.id]);

    res.send(result.rows);
  } catch (err: any) {
    console.error(err.message);

    res.status(500).send("Error getting priviledges");
  }
};


// GET /GetPriviledges
export const getPrivileges = async (req: any, res: any) => {

  const query = "SELECT * FROM priviliedge";

  try {
    const result = await pool.query(query);

    res.send(result.rows);
  } catch (err: any) {
    console.error(err.message);

    res.status(500).send("Error getting priviledges");
  }
};


// GET /GetPriviledge/:id
export const getPrivilegeById = async (req: any, res: any) => {

  const query =
    "SELECT * FROM priviliedge WHERE id=$1";

  try {
    const result = await pool.query(query, [req.params.id]);

    res.send(result.rows);
  } catch (err: any) {
    console.error(err.message);

    res.status(500).send("Error getting priviledge");
  }
};


// POST /check-privilege
export const checkPrivilege = async (req: any, res: any) => {

  const { privilege_id } = req.body;

  const current_admin_id = req.user.Current_id;

  const checkQuery = `
        SELECT privilege_id
        FROM admin_previlledge
        WHERE account_id = $1
          AND privilege_id = $2
    `;

  const checkresult = await pool.query(checkQuery, [
    current_admin_id,
    privilege_id,
  ]);

  if (checkresult.rows.length === 0) {
    return res.status(403).json({
      message: "You are not authorized to enter this page",
    });
  }

  return res.status(200).json({
    message: "Welcome",
  });
};


// POST /AssignPrivilege
export const assignPrivilege = async (req: any, res: any) => {

  const { account_id, privilege_ids } = req.body;
console.log("account_id", account_id);
console.log("privilege_ids", privilege_ids);
  if (!account_id || !Array.isArray(privilege_ids)) {
    return res.status(400).json({
      message: "account_id and privilege_ids are required",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const current_admin_id = req.user.Current_id;

    const checkQuery =
      "select privilege_id from admin_previlledge where account_id=$1 and privilege_id=ANY($2::int[])";

    const checkresult = await client.query(checkQuery, [
      current_admin_id,
      privilege_ids,
    ]);

   const authorizedIds: number[] = checkresult.rows.map((r: any) => Number(r.privilege_id));

    const deniedIds: number[] = privilege_ids.filter(
      (id: number) => !authorizedIds.includes(id)
    );
    console.log("authorizedIds", authorizedIds);
    console.log("deniedIds", deniedIds);

    if (deniedIds.length > 0) {
      await client.query("ROLLBACK");

      return res.status(403).json({
        message: "You are not authorized to assign some of these privileges",
        denied: deniedIds,
      });
    }

    await client.query(
      `DELETE FROM admin_previlledge
       WHERE account_id = $1
         AND privilege_id <> ALL($2::bigint[])`,
      [account_id, privilege_ids]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Privileges updated successfully",
      granted: privilege_ids,
    });

  } catch (err: any) {

    await client.query("ROLLBACK");

    console.error(err.message);

    return res.status(500).json({
      message: "Error updating privileges",
    });

  } finally {
    client.release();
  }
};