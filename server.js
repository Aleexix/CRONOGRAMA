"use strict";

const path = require("path");
const crypto = require("crypto");
const express = require("express");
const { Pool } = require("pg");

const PORT = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  console.error("Falta la variable de entorno DATABASE_URL (conexion a Postgres).");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

const SEED_TASKS = [
  { seq: 1, label: "Nuevo formato de reincidencias y regla de generación de servicios - not", priority: "ALTA", progress: 0, start: "2026-09-07", end: "2026-09-10", owner: "", status: "ABIERTO" },
  { seq: 2, label: "Automatización de fecha y hora de coordinación - 202607-0016", priority: "ALTA", progress: 95, start: "2026-09-01", end: "2026-09-10", owner: "", status: "EN_PROCESO" },
  { seq: 3, label: "Fecha de vencimiento BBVA - 202609-0004", priority: "MEDIA", progress: 70, start: "2026-09-01", end: "2026-09-10", owner: "", status: "EN_PROCESO" },
  { seq: 4, label: "Causal automática BBVA - not", priority: "BAJA", progress: 0, start: "2026-09-10", end: "2026-09-17", owner: "", status: "ABIERTO" },
  { seq: 5, label: "Escalamientos automáticos a las TDV - 202608-0017", priority: "BAJA", progress: 0, start: "2026-09-10", end: "2026-09-14", owner: "", status: "ABIERTO" },
  { seq: 6, label: "Bloqueo botón DB - not", priority: "ALTA", progress: 0, start: "2026-09-10", end: "2026-09-14", owner: "", status: "ABIERTO" },
  { seq: 7, label: "Alerta de coordinación de servicios - not", priority: "ALTA", progress: 0, start: "2026-09-10", end: "2026-09-14", owner: "", status: "ABIERTO" },
  { seq: 8, label: "Botón de incumplimiento de TDV - not", priority: "BAJA", progress: 0, start: "2026-09-10", end: "2026-09-15", owner: "", status: "ABIERTO" },
  { seq: 9, label: "Ajuste bots para monitoreo - 202607-0009", priority: "ALTA", progress: 90, start: "2026-09-02", end: "2026-09-10", owner: "", status: "EN_PROCESO" },
  { seq: 10, label: "Generación de servicios por integración directa - not", priority: "MEDIA", progress: 0, start: "2026-09-10", end: "2026-09-17", owner: "", status: "ABIERTO" },
  { seq: 11, label: "Mejora del flujo o bot de cancelaciones - 202607-0018", priority: "ALTA", progress: 0, start: "2026-09-10", end: "2026-09-17", owner: "", status: "ABIERTO" },
  { seq: 12, label: "Cambio y seguimiento: pendiente vendor → pendiente proveedor - not", priority: "MEDIA", progress: 0, start: "2026-09-17", end: "2026-09-21", owner: "", status: "ABIERTO" },
  { seq: 13, label: "Bloqueo de ATM desmontados - not", priority: "MEDIA", progress: 0, start: "2026-09-17", end: "2026-09-21", owner: "", status: "ABIERTO" },
  { seq: 14, label: "Asistente virtual Mónica - not", priority: "ESTRATEGICA", progress: 0, start: "2026-09-07", end: "2026-09-18", owner: "", status: "INVESTIGANDO" },
  { seq: 15, label: "Sugerencia de coordinación DVV - not", priority: "BAJA", progress: 0, start: "2026-09-07", end: "2026-09-11", owner: "", status: "ABIERTO" },
  { seq: 16, label: "Solicitud validación casos repetidos misma gestión - 202604-0033", priority: "ALTA", progress: 0, start: "", end: "", owner: "", status: "ABIERTO" },
  { seq: 17, label: "Solicitud integración Helix-BCM - 202607-0002", priority: "MEDIA", progress: 0, start: "", end: "", owner: "", status: "ABIERTO" },
  { seq: 18, label: "MODIFICACIÓN REGLA DE INGRESOS DAVIVIENDA - 202607-0007", priority: "ALTA", progress: 90, start: "2026-09-01", end: "2026-09-07", owner: "", status: "EN_PROCESO" },
  { seq: 19, label: "Solicitud informe medición tiempos FLM Bancolombia - 202607-0008", priority: "BAJA", progress: 35, start: "2026-08-28", end: "2026-09-09", owner: "", status: "EN_PROCESO" },
  { seq: 20, label: "INFORMACIÓN BBVA EN DETALLE DEL TICKET - 202607-0019", priority: "BAJA", progress: 85, start: "2026-09-01", end: "2026-09-07", owner: "", status: "EN_PROCESO" },
  { seq: 21, label: "Solicitud correos oficinas - 202607-0020", priority: "MEDIA", progress: 0, start: "", end: "", owner: "", status: "ABIERTO" },
  { seq: 22, label: "REVISION AUTOMATICA BITACORA - 202608-0001", priority: "BAJA", progress: 0, start: "", end: "", owner: "", status: "ABIERTO" },
  { seq: 23, label: "Solicitud ajuste informe KPI Efectividad Monitoreo - 202608-0005", priority: "MEDIA", progress: 0, start: "", end: "", owner: "", status: "ABIERTO" },
  { seq: 24, label: "Solicitud actualización linea base nombre ATM - 202608-0006", priority: "BAJA", progress: 0, start: "", end: "", owner: "", status: "ABIERTO" },
  { seq: 25, label: "AUTOMATIZACIÓN GENERACIÓN NUEVO TK - 202608-0008", priority: "MEDIA", progress: 0, start: "", end: "", owner: "", status: "ABIERTO" },
  { seq: 26, label: "Malla de turnos Delvery y Operaciones - 202603-096", priority: "MEDIA", progress: 0, start: "", end: "", owner: "", status: "ABIERTO" },
  { seq: 27, label: "Solicitud validación incumplimientos de TDV consolidado por fechas - 202604-052", priority: "MEDIA", progress: 0, start: "", end: "", owner: "", status: "ABIERTO" },
  { seq: 28, label: "Solicitud validación casos repetidos misma gestión - 202604-104", priority: "MEDIA", progress: 0, start: "", end: "", owner: "", status: "ABIERTO" },
  { seq: 29, label: "HABILITAR BOTON PARA CAJEROS MULTIFUNCIONALES DIEBOLD - 202608-0016", priority: "ALTA", progress: 0, start: "", end: "", owner: "", status: "ABIERTO" },
  { seq: 30, label: "AGREGAR COLUMNA PROVEEDOR CANAL - 202608-0014", priority: "MEDIA", progress: 0, start: "", end: "", owner: "", status: "ABIERTO" },
  { seq: 31, label: "RESTRICCIÓN RESPONSABLES - 202608-0013", priority: "MEDIA", progress: 0, start: "", end: "", owner: "", status: "ABIERTO" },
  { seq: 32, label: "MEJORA INTEGRACIÓN BCM, GENERACIÓN DE SERVICIO SLM - 202609-0001", priority: "MEDIA", progress: 0, start: "", end: "", owner: "", status: "ABIERTO" },
  { seq: 33, label: "CORREO AUTOMATICO PARA ESCALAR ABIERTOS - 202608-0017", priority: "MEDIA", progress: 0, start: "", end: "", owner: "", status: "ABIERTO" },
];

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      seq INTEGER NOT NULL DEFAULT 0,
      label TEXT NOT NULL DEFAULT '',
      priority TEXT NOT NULL DEFAULT 'MEDIA',
      progress INTEGER NOT NULL DEFAULT 0,
      start TEXT NOT NULL DEFAULT '',
      "end" TEXT NOT NULL DEFAULT '',
      owner TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'ABIERTO',
      pending_note TEXT NOT NULL DEFAULT '',
      progress_before_done INTEGER,
      status_before_done TEXT,
      description TEXT NOT NULL DEFAULT ''
    );
  `);
  // migracion idempotente para bases ya existentes (creadas antes de agregar esta columna)
  await pool.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS history (
      id SERIAL PRIMARY KEY,
      ts TIMESTAMPTZ NOT NULL DEFAULT now(),
      who TEXT NOT NULL DEFAULT 'Anónimo',
      action TEXT NOT NULL,
      task TEXT NOT NULL DEFAULT '(sin nombre)',
      field TEXT,
      from_val TEXT,
      to_val TEXT
    );
  `);

  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM tasks");
  if (rows[0].n === 0) {
    for (const t of SEED_TASKS) {
      const id = "t" + t.seq;
      await pool.query(
        `INSERT INTO tasks (id, seq, label, priority, progress, start, "end", owner, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO NOTHING`,
        [id, t.seq, t.label, t.priority, t.progress, t.start, t.end, t.owner, t.status]
      );
    }
  }
}

function rowToTask(row) {
  return {
    id: row.id,
    seq: row.seq,
    label: row.label,
    priority: row.priority,
    progress: row.progress,
    start: row.start,
    end: row.end,
    owner: row.owner,
    status: row.status,
    pendingNote: row.pending_note,
    description: row.description,
    progressBeforeDone: row.progress_before_done == null ? undefined : row.progress_before_done,
    statusBeforeDone: row.status_before_done || undefined,
  };
}

function rowToHistory(row) {
  return {
    ts: row.ts.toISOString(),
    who: row.who,
    action: row.action,
    task: row.task,
    field: row.field || undefined,
    from: row.from_val,
    to: row.to_val,
  };
}

const FIELD_TO_COLUMN = {
  label: "label",
  priority: "priority",
  progress: "progress",
  start: "start",
  end: '"end"',
  owner: "owner",
  status: "status",
  pendingNote: "pending_note",
  description: "description",
  progressBeforeDone: "progress_before_done",
  statusBeforeDone: "status_before_done",
};

async function logHistory(client, entry) {
  await client.query(
    `INSERT INTO history (who, action, task, field, from_val, to_val) VALUES ($1,$2,$3,$4,$5,$6)`,
    [entry.who || "Anónimo", entry.action, entry.task || "(sin nombre)", entry.field || null,
      entry.from == null ? null : String(entry.from), entry.to == null ? null : String(entry.to)]
  );
  await client.query(
    `DELETE FROM history WHERE id NOT IN (SELECT id FROM history ORDER BY ts DESC LIMIT 200)`
  );
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/tasks", async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tasks ORDER BY seq ASC');
    res.json(rows.map(rowToTask));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "db_error" });
  }
});

app.post("/api/tasks", async (req, res) => {
  const client = await pool.connect();
  try {
    const body = req.body || {};
    const who = body.who || "Anónimo";
    await client.query("BEGIN");
    const { rows: maxRows } = await client.query("SELECT COALESCE(MAX(seq),0)::int AS max FROM tasks");
    const seq = maxRows[0].max + 1;
    const id = "t-" + Date.now().toString(36) + "-" + crypto.randomBytes(4).toString("hex");
    const label = body.label || "";
    const priority = body.priority || "MEDIA";
    const progress = Number(body.progress || 0);
    const start = body.start || "";
    const end = body.end || "";
    const owner = body.owner || "";
    const status = body.status || "ABIERTO";
    await client.query(
      `INSERT INTO tasks (id, seq, label, priority, progress, start, "end", owner, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, seq, label, priority, progress, start, end, owner, status]
    );
    await logHistory(client, { who, action: "add", task: label || "(sin nombre)" });
    await client.query("COMMIT");
    res.json({ id });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "db_error" });
  } finally {
    client.release();
  }
});

app.patch("/api/tasks/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const body = req.body || {};
    const who = body.who || "Anónimo";
    await client.query("BEGIN");
    const { rows } = await client.query("SELECT * FROM tasks WHERE id = $1 FOR UPDATE", [id]);
    if (!rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "not_found" });
    }
    const prev = rowToTask(rows[0]);
    const sets = [];
    const values = [];
    let i = 1;
    for (const key of Object.keys(body)) {
      if (key === "who") continue;
      const column = FIELD_TO_COLUMN[key];
      if (!column) continue;
      sets.push(`${column} = $${i}`);
      values.push(body[key]);
      i++;
    }
    if (sets.length) {
      values.push(id);
      await client.query(`UPDATE tasks SET ${sets.join(", ")} WHERE id = $${i}`, values);
    }
    const HISTORY_SKIP = { who: true, progressBeforeDone: true, statusBeforeDone: true };
    for (const key of Object.keys(body)) {
      if (HISTORY_SKIP[key] || !FIELD_TO_COLUMN[key]) continue;
      const prevVal = prev[key];
      const nextVal = body[key];
      if (String(prevVal == null ? "" : prevVal) !== String(nextVal == null ? "" : nextVal)) {
        await logHistory(client, {
          who, action: "update", task: prev.label || "(sin nombre)",
          field: key, from: prevVal, to: nextVal,
        });
      }
    }
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "db_error" });
  } finally {
    client.release();
  }
});

app.post("/api/tasks/:id/delete", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const who = (req.body && req.body.who) || "Anónimo";
    await client.query("BEGIN");
    const { rows } = await client.query("SELECT * FROM tasks WHERE id = $1", [id]);
    if (rows.length) {
      const prev = rowToTask(rows[0]);
      await client.query("DELETE FROM tasks WHERE id = $1", [id]);
      await logHistory(client, { who, action: "remove", task: prev.label || "(sin nombre)" });
    }
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "db_error" });
  } finally {
    client.release();
  }
});

app.get("/api/history", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM (SELECT * FROM history ORDER BY ts DESC LIMIT 200) sub ORDER BY ts ASC"
    );
    res.json(rows.map(rowToHistory));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "db_error" });
  }
});

app.get("/health", (req, res) => res.json({ ok: true }));

ensureSchema()
  .then(() => {
    app.listen(PORT, () => console.log("Cronograma BCM escuchando en puerto " + PORT));
  })
  .catch((err) => {
    console.error("No se pudo preparar la base de datos:", err);
    process.exit(1);
  });
