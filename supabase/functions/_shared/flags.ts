import postgres from "postgres";

export async function flagEnabled(
  sql: postgres.Sql,
  flag: string,
): Promise<boolean> {
  try {
    const result = await sql<{ enabled: boolean }[]>`
      SELECT enabled FROM public.flags WHERE flag = ${flag}
    `;
    return result[0]?.enabled ?? false;
  } catch {
    return false;
  }
}
