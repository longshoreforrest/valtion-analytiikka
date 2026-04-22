/**
 * DuckDB-Wasm -yhteyden hallinta.
 *
 * Yksi jaettu instanssi koko sovellukselle: Parquet-tiedosto rekisteröidään
 * kerran nimellä 'budget.parquet' ja sen jälkeen sitä voi kysellä SQL:llä
 * kaikista komponenteista.
 */
import * as duckdb from "@duckdb/duckdb-wasm";
import duckdb_wasm from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
import mvp_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
import duckdb_wasm_eh from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";
import eh_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
  mvp: { mainModule: duckdb_wasm, mainWorker: mvp_worker },
  eh: { mainModule: duckdb_wasm_eh, mainWorker: eh_worker },
};

let _db: duckdb.AsyncDuckDB | null = null;
let _conn: duckdb.AsyncDuckDBConnection | null = null;
let _initPromise: Promise<duckdb.AsyncDuckDBConnection> | null = null;

async function initDuckDB(): Promise<duckdb.AsyncDuckDBConnection> {
  const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
  const worker = new Worker(bundle.mainWorker!, { type: "module" });
  const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  const conn = await db.connect();

  const parquetUrl = new URL("./data/budget.parquet", window.location.href).href;
  const metaUrl = new URL("./data/build_meta.json", window.location.href).href;
  const pfUrl = new URL("./data/public_finance.parquet", window.location.href).href;
  const euUrl = new URL("./data/eurostat_cofog.parquet", window.location.href).href;

  await db.registerFileURL(
    "budget.parquet",
    parquetUrl,
    duckdb.DuckDBDataProtocol.HTTP,
    false
  );
  await db.registerFileURL(
    "public_finance.parquet",
    pfUrl,
    duckdb.DuckDBDataProtocol.HTTP,
    false
  );

  // Eurostat rekisteröinti suojataan: jos tiedostoa ei ole (pipeline ei ajettu),
  // päänäkymät toimivat silti.
  let hasEurostat = false;
  try {
    await db.registerFileURL(
      "eurostat_cofog.parquet",
      euUrl,
      duckdb.DuckDBDataProtocol.HTTP,
      false
    );
    hasEurostat = true;
  } catch {
    hasEurostat = false;
  }

  await conn.query(`
    CREATE OR REPLACE VIEW budget AS
    SELECT * FROM read_parquet('budget.parquet');
    CREATE OR REPLACE VIEW public_finance AS
    SELECT * FROM read_parquet('public_finance.parquet');
  `);
  if (hasEurostat) {
    try {
      await conn.query(`
        CREATE OR REPLACE VIEW eurostat_cofog AS
        SELECT * FROM read_parquet('eurostat_cofog.parquet');
      `);
    } catch {
      /* ignore */
    }
  }

  _db = db;
  _conn = conn;
  (window as any).__duckdb_meta_url = metaUrl;
  return conn;
}

export async function getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
  if (_conn) return _conn;
  if (!_initPromise) _initPromise = initDuckDB();
  return _initPromise;
}

export async function query<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  const conn = await getConnection();
  const result = await conn.query(sql);
  return result.toArray().map((r: any) => {
    const o: Record<string, unknown> = {};
    for (const f of result.schema.fields) {
      const v = r[f.name];
      if (typeof v === "bigint") o[f.name] = Number(v);
      else o[f.name] = v;
    }
    return o as T;
  });
}

export async function getBuildMeta(): Promise<BuildMeta | null> {
  try {
    const url = new URL("./data/build_meta.json", window.location.href).href;
    const r = await fetch(url);
    if (!r.ok) return null;
    return (await r.json()) as BuildMeta;
  } catch {
    return null;
  }
}

export interface PublicFinanceMeta {
  generated_at: string;
  row_count: number;
  tables: Array<{ table: string; url: string; title: string; rivit: number }>;
  license: string;
  source_base: string;
}

export async function getPublicFinanceMeta(): Promise<PublicFinanceMeta | null> {
  try {
    const url = new URL("./data/public_finance_meta.json", window.location.href).href;
    const r = await fetch(url);
    if (!r.ok) return null;
    return (await r.json()) as PublicFinanceMeta;
  } catch {
    return null;
  }
}

export interface BuildMeta {
  generated_at: string;
  row_count: number;
  years: number[];
  doc_types: string[];
  paaluokat: number[];
  source_url: string;
  license: string;
  license_url: string;
  sources_fetched: Array<{ year: number; doc: string; paaluokka: number; url: string; rivit: number }>;
  missing: Array<{ year: number; doc: string; paaluokka: number; reason?: string }>;
}

export function isDuckDBReady(): boolean {
  return _conn !== null;
}

export async function shutdown(): Promise<void> {
  if (_conn) await _conn.close();
  if (_db) await _db.terminate();
  _conn = null;
  _db = null;
  _initPromise = null;
}
