// Lista o que ainda depende do escritório antes da publicação oficial.
// Uso: npm run check:config
import { pendingFields, site } from "../config/site.ts";

const pending = pendingFields();
console.log(`\n${site.name}\n`);
if (pending.length === 0) {
  console.log("Nada pendente na configuração.");
} else {
  console.log(`Pendente (${pending.length}):`);
  for (const item of pending) console.log(`  • ${item}`);
}
console.log("\nTextos institucionais, áreas, FAQ e política de privacidade: revisar com o Dr. Odair (Provimento 205/2021).\n");
