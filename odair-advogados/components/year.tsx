import { cacheLife } from "next/cache";

/** Ano corrente do rodapé, guardado em cache e recalculado uma vez por dia. */
export async function Year() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
