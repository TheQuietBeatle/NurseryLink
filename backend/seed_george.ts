const pool = require('./db');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── 1. Create accounts ──
    const georgeAcc = await client.query(`
      INSERT INTO account (username, full_name, email, password, role)
      VALUES ('george.sameh', 'George Sameh', 'george.samehsm@gmail.com', 'gogosm2020', 'parent')
      ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING id
    `);
    const georgeId = georgeAcc.rows[0].id;

    const claraAcc = await client.query(`
      INSERT INTO account (username, full_name, email, password, role)
      VALUES ('clara.sameh', 'Clara Sameh', 'clara.samehsm@gmail.com', 'gogosm2020', 'parent')
      ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING id
    `);
    const claraId = claraAcc.rows[0].id;
    console.log(`Accounts: George=${georgeId}, Clara=${claraId}`);

    // ── 2. Create parent records ──
    const georgeParent = await client.query(`
      INSERT INTO parent (account_id, child_count, gender) VALUES ($1, 0, 'male')
      ON CONFLICT DO NOTHING RETURNING id
    `, [georgeId]);
    let georgeParentId = georgeParent.rows[0]?.id;
    if (!georgeParentId) {
      const r = await client.query(`SELECT id FROM parent WHERE account_id = $1`, [georgeId]);
      georgeParentId = r.rows[0].id;
    }

    const claraParent = await client.query(`
      INSERT INTO parent (account_id, child_count, gender) VALUES ($1, 0, 'female')
      ON CONFLICT DO NOTHING RETURNING id
    `, [claraId]);
    let claraParentId = claraParent.rows[0]?.id;
    if (!claraParentId) {
      const r = await client.query(`SELECT id FROM parent WHERE account_id = $1`, [claraId]);
      claraParentId = r.rows[0].id;
    }
    console.log(`Parents: George=${georgeParentId}, Clara=${claraParentId}`);

    // ── 3. Create child Jonathan (class 3 = Busy Bees) ──
    const jonathan = await client.query(`
      INSERT INTO child (parent_id, account_id, class_id, name, date_of_birth, summary_log)
      VALUES ($1, NULL, 3, 'Jonathan Sameh', '2023-06-15',
        'Jonathan is a cheerful and curious boy who loves building blocks and painting. He is very social and enjoys group activities.')
      RETURNING id
    `, [georgeParentId]);
    const jonathanId = jonathan.rows[0].id;

    await client.query(`INSERT INTO child_parent (child_id, parent_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [jonathanId, georgeParentId]);
    await client.query(`INSERT INTO child_parent (child_id, parent_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [jonathanId, claraParentId]);
    await client.query(`UPDATE parent SET child_count = 1 WHERE id IN ($1, $2)`, [georgeParentId, claraParentId]);
    console.log(`Jonathan id: ${jonathanId}, linked to both parents.`);

    // Use teacher_id 3 (Lisa Rodriguez, Busy Bees)
    const teacherAccountId = 33; // Lisa Rodriguez's account_id

    // ── 4. Seed temperature logs ──
    console.log('Seeding temperatures...');
    await client.query(`
      WITH dates AS (
        SELECT generate_series(
          '2026-01-05 09:30:00'::timestamp,
          '2026-08-20 16:00:00'::timestamp,
          '3 days'::interval
        ) AS d
      )
      INSERT INTO activity_logs (account_id, child_id, log_type, activity_timestamp, degree_celsius, comments)
      SELECT
        33, ${jonathanId}, 'temperature', d,
        ROUND(((36.4 + random() * 2.2))::numeric, 1)::double precision,
        CASE
          WHEN random() < 0.05 THEN 'HIGH FEVER - needs immediate attention'
          WHEN random() < 0.15 THEN 'Fever detected - monitoring closely'
          WHEN random() < 0.3 THEN 'Slightly elevated - keeping an eye on it'
          ELSE 'Normal temperature - all good'
        END
      FROM dates
    `);
    const tempCount = await client.query(`SELECT COUNT(*)::int AS c FROM activity_logs WHERE child_id = ${jonathanId} AND log_type = 'temperature'`);
    console.log(`  ${tempCount.rows[0].c} temperature logs.`);

    // ── 5. Seed meal logs ──
    console.log('Seeding meals...');
    await client.query(`
      WITH dates AS (
        SELECT generate_series(
          '2026-01-05 08:30:00'::timestamp,
          '2026-08-20 16:00:00'::timestamp,
          '2 days'::interval
        ) AS d
      )
      INSERT INTO activity_logs (account_id, child_id, log_type, activity_timestamp, comments, food_portion, meal_type)
      SELECT
        33, ${jonathanId}, 'meal',
        d + (ARRAY['08:30','12:00','15:30'])[1 + floor(random()*3)::int]::interval,
        (ARRAY[
          'Jonathan ate all of his breakfast and asked for seconds',
          'Enjoyed the pasta today, ate most of it',
          'Had a good lunch, ate the vegetables and chicken',
          'Snack time - loved the fruit platter',
          'Ate half of lunch, was too excited about play time',
          'Finished everything on his plate today',
          'Was a bit picky today, ate the bread and fruit only',
          'Loved the fish fingers and mashed potatoes',
          'Ate all the rice and beans, very hungry today',
          'Had a light snack, saved room for afternoon activities'
        ])[1 + floor(random()*10)::int],
        (ARRAY['Full','Half','Small'])[1 + floor(random()*3)::int],
        (ARRAY['Breakfast','Lunch','Snack'])[1 + floor(random()*3)::int]
      FROM dates
      WHERE extract(dow FROM d) BETWEEN 1 AND 5
    `);
    const mealCount = await client.query(`SELECT COUNT(*)::int AS c FROM activity_logs WHERE child_id = ${jonathanId} AND log_type = 'meal'`);
    console.log(`  ${mealCount.rows[0].c} meal logs.`);

    // ── 6. Seed toilet logs ──
    console.log('Seeding toilet logs...');
    await client.query(`
      WITH dates AS (
        SELECT generate_series(
          '2026-01-05 09:00:00'::timestamp,
          '2026-08-20 16:00:00'::timestamp,
          '2 days'::interval
        ) AS d
      )
      INSERT INTO activity_logs (account_id, child_id, log_type, activity_timestamp, comments, toilet_type)
      SELECT
        33, ${jonathanId}, 'toilet',
        d + (random() * interval '6 hours'),
        (ARRAY[
          'Successful potty visit - very proud!',
          'Used the potty with help from teacher',
          'Dry diaper check at 11:30',
          'Wet diaper - changed and cleaned',
          'Accident at 10:15 - changed clothes, was a bit upset',
          'Potty time went well, washed hands afterwards'
        ])[1 + floor(random()*6)::int],
        (ARRAY['Potty','Diaper'])[1 + floor(random()*2)::int]
      FROM dates
      WHERE extract(dow FROM d) BETWEEN 1 AND 5
    `);
    const toiletCount = await client.query(`SELECT COUNT(*)::int AS c FROM activity_logs WHERE child_id = ${jonathanId} AND log_type = 'toilet'`);
    console.log(`  ${toiletCount.rows[0].c} toilet logs.`);

    // ── 7. Seed sleep logs ──
    console.log('Seeding sleep logs...');
    await client.query(`
      WITH dates AS (
        SELECT generate_series(
          '2026-01-05 12:30:00'::timestamp,
          '2026-08-20 14:00:00'::timestamp,
          '2 days'::interval
        ) AS d
      )
      INSERT INTO activity_logs (account_id, child_id, log_type, activity_timestamp, comments, sleep_duration_minutes)
      SELECT
        33, ${jonathanId}, 'sleep',
        d + (random() * interval '30 minutes'),
        (ARRAY[
          'Slept peacefully for the full nap time',
          'Woke up after 45 minutes, was a bit groggy',
          'Deep sleep - rested very well',
          'Had trouble falling asleep but eventually slept for an hour',
          'Slept like a rock! Very well rested.'
        ])[1 + floor(random()*5)::int],
        (60 + floor(random() * 60))::int
      FROM dates
      WHERE extract(dow FROM d) BETWEEN 1 AND 5
    `);
    const sleepCount = await client.query(`SELECT COUNT(*)::int AS c FROM activity_logs WHERE child_id = ${jonathanId} AND log_type = 'sleep'`);
    console.log(`  ${sleepCount.rows[0].c} sleep logs.`);

    // ── 8. Seed incidents ──
    console.log('Seeding incidents...');
    const incidents = [
      { desc: 'Minor scrape on knee during outdoor play at 10:30. Cleaned and bandaged.', sev: 'low' },
      { desc: 'Fell off the small slide at 11:15 - no serious injury, was crying for 5 minutes then cheered up.', sev: 'low' },
      { desc: 'Bumped head on the table corner at 09:45 - ice pack applied for 10 minutes, no swelling.', sev: 'medium' },
      { desc: 'Mild allergic reaction to a snack at 10:00 - antihistamine administered per parent instructions. Rash subsided within 30 minutes.', sev: 'high' },
      { desc: 'Tripped while running in the playground at 15:00 - scraped elbow, cleaned and bandaged. Jonathan was brave!', sev: 'low' },
      { desc: 'Got into a small disagreement with another child over a toy at 11:00 - both calmed down quickly with teacher guidance.', sev: 'low' },
      { desc: 'Temperature reading of 38.3C at 13:00 - parents notified, child sent home early as a precaution.', sev: 'medium' },
    ];
    for (const inc of incidents) {
      const daysAgo = 5 + Math.floor(Math.random() * 90);
      const r = await client.query(`
        INSERT INTO incidient_report (child_id, teacher_id, description, severity_level, incident_timestamp, reported_at, resolved_at)
        VALUES ($1, $2, $3, $4,
          NOW() - INTERVAL '${daysAgo} days',
          NOW() - INTERVAL '${daysAgo} days' + INTERVAL '5 minutes',
          NOW() - INTERVAL '${daysAgo} days' + INTERVAL '1 hour'
        ) RETURNING id
      `, [jonathanId, 3, inc.desc, inc.sev]);
      const incId = r.rows[0].id;
      await client.query(`INSERT INTO incident_to_parent (incidient_id, parent_id, notified_at, acknowledged_at) VALUES ($1, $2, NOW() - INTERVAL '${daysAgo} days' + INTERVAL '10 minutes', NOW() - INTERVAL '${daysAgo} days' + INTERVAL '1 hour')`, [incId, georgeParentId]);
      await client.query(`INSERT INTO incident_to_parent (incidient_id, parent_id, notified_at, acknowledged_at) VALUES ($1, $2, NOW() - INTERVAL '${daysAgo} days' + INTERVAL '10 minutes', NOW() - INTERVAL '${daysAgo} days' + INTERVAL '1 hour')`, [incId, claraParentId]);
    }
    console.log(`  ${incidents.length} incidents.`);

    // ── 9. Seed supply requests ──
    console.log('Seeding supplies...');
    await client.query(`
      WITH sr AS (
        INSERT INTO supply_request (teacher_id, item, quantity, note, requested_at, fulfilled_at, status)
        VALUES
          (3, 'Crayons - 16 pack', 10, 'Jonathan loves drawing, running low on crayons', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days', 'fulfilled'),
          (3, 'Construction paper', 20, 'For the upcoming art project next week', NOW() - INTERVAL '5 days', NULL, 'pending'),
          (3, 'Glue sticks - 20g', 5, 'Regular restock for crafts', NOW() - INTERVAL '3 days', NULL, 'approved')
        RETURNING id
      )
      INSERT INTO supplyrequest_to_parent (supply_id, parent_id, notified_at, responded_at, response)
      SELECT id, ${georgeParentId}, NOW() - INTERVAL '10 days' + INTERVAL '15 minutes',
        CASE WHEN random() > 0.3 THEN NOW() - INTERVAL '9 days' ELSE NULL END,
        (ARRAY['Will bring it tomorrow','Approved, ordering now','On the way'])[1 + floor(random()*3)::int]
      FROM sr
    `);
    console.log('  3 supply requests.');

    // ── 10. Seed notifications ──
    console.log('Seeding notifications...');
    await client.query(`
      INSERT INTO notifications (account_id, notification_type, sent_at, seen, handled, description, priority)
      VALUES
        (${georgeId}, 'incident', NOW() - INTERVAL '45 days', TRUE, FALSE,
         'Jonathan had a minor scrape on knee during outdoor play. Details in the app.', 'normal'),
        (${georgeId}, 'incident', NOW() - INTERVAL '30 days', TRUE, FALSE,
         'Jonathan bumped his head on the table. Ice applied. Please check in when you arrive.', 'high'),
        (${georgeId}, 'temperature_alert', NOW() - INTERVAL '15 days', TRUE, TRUE,
         'FEVER ALERT: Jonathan temperature is 38.3C at 1:00 PM. Please pick him up.', 'urgent'),
        (${georgeId}, 'activity', NOW() - INTERVAL '5 days', TRUE, TRUE,
         'Jonathan ate all of his lunch today! He especially loved the chicken and rice.', 'low'),
        (${georgeId}, 'activity', NOW() - INTERVAL '3 days', TRUE, TRUE,
         'Jonathan napped peacefully for 90 minutes this afternoon. Very well rested!', 'low'),
        (${georgeId}, 'attendance', NOW() - INTERVAL '1 days', FALSE, FALSE,
         'Jonathan was checked in at 8:45 AM today. He arrived happily!', 'low'),
        (${georgeId}, 'announcement', NOW() - INTERVAL '2 days', FALSE, FALSE,
         'Class photo day is scheduled for next Friday at 9:30 AM. Please dress Jonathan in bright colors!', 'normal'),
        (${georgeId}, 'activity', NOW() - INTERVAL '7 days', TRUE, TRUE,
         'Jonathan successfully used the potty today! He was very proud of himself.', 'low'),
        (${georgeId}, 'incident', NOW() - INTERVAL '20 days', TRUE, TRUE,
         'Jonathan had a mild allergic reaction to a snack. Antihistamine given per your instructions.', 'high'),
        (${georgeId}, 'announcement', NOW() - INTERVAL '1 days', FALSE, FALSE,
         'Parent-teacher conference next week. 15-minute slots available. Please book your time.', 'normal')
    `);
    console.log('  10 notifications.');

    await client.query('COMMIT');
    console.log('\n=== SEED COMPLETE ===');
    console.log(`Login: george.samehsm@gmail.com / gogosm2020`);
    console.log(`Clara: clara.samehsm@gmail.com / gogosm2020`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('FAILED:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
