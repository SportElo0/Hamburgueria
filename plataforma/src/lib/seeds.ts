import 'server-only';
import downtown from '../../seed/downtown-burger.json';
import gara from '../../seed/gara-pizza.json';
import semvo from '../../seed/semvo.json';
import surflife from '../../seed/surflife.json';
import { storeSchema, type Store } from './schema';

/** Starting data for the stores already sold, extracted from their live sites. */
export function seedStores(): Store[] {
  return [downtown, gara, semvo, surflife].map((s) => storeSchema.parse(s));
}
