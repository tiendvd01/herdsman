// Spec 016: writes src/styles/theme-roles.css (Tailwind `@theme inline` colour block) from src/theme/roles.ts.
// Node >= 24 runs the .ts directly. `--check` only verifies the file is up to date (exit 1 if not).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { themeRolesCss } from '../src/theme/roles.ts';

const out = fileURLToPath(new URL('../src/styles/theme-roles.css', import.meta.url));
const css = themeRolesCss();
if (process.argv.includes('--check')) {
  let cur = '';
  try { cur = readFileSync(out, 'utf8'); } catch {}
  if (cur !== css) { console.error('src/styles/theme-roles.css is stale — run `pnpm theme:gen`'); process.exit(1); }
} else {
  writeFileSync(out, css);
  console.log('wrote src/styles/theme-roles.css');
}
