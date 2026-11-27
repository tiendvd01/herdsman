import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
if (args[0] === 'dev') {
  const config = fileURLToPath(new URL('../src-tauri/tauri.dev.conf.json', import.meta.url));
  args.splice(1, 0, '--config', config);
  if (process.platform === 'darwin') {
    const runner = fileURLToPath(new URL('./tauri-dev-macos.mjs', import.meta.url));
    const cargoConfig = `target.'cfg(target_os = "macos")'.runner = ${JSON.stringify([process.execPath, runner])}`;
    if (!args.includes('--')) args.push('--');
    args.splice(args.indexOf('--') + 1, 0, '--config', cargoConfig);
  }
}

const result = spawnSync(process.execPath, [require.resolve('@tauri-apps/cli/tauri.js'), ...args], {
  stdio: 'inherit',
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
