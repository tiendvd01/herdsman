import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

if (process.platform !== 'darwin') process.exit(0);

const root = fileURLToPath(new URL('../', import.meta.url));
const target = path.join(root, 'src-tauri/target');
const arch = process.env.TAURI_ENV_ARCH ?? process.arch;
const nodeArch = { aarch64: 'arm64', arm64: 'arm64', x86_64: 'x64', x64: 'x64' }[arch];
const nodeChecksums = {
  arm64: '0be2ab2816a4fa02d1acff014a434f29f56d8d956f5af6a98b70ced6c5f4d201',
  x64: '3884671e87f46f773832d98a0a6cabcc5ec4f637084f0f3515b69e66ea27f2f1',
};
if (!nodeArch) throw new Error(`Unsupported macOS installer architecture: ${arch}`);

const nodeVersion = 'v24.11.0';
const distribution = `node-${nodeVersion}-darwin-${nodeArch}`;
const codexVersion = '0.172.0';
const codexTarget = nodeArch === 'arm64' ? 'aarch64-apple-darwin' : 'x86_64-apple-darwin';
const codexChecksums = {
  arm64: '0970016d48209a09c4039139629ed79b4a31c5e3d864e792c043419d98fa6466',
  x64: 'b5e94828f45171f13d81de2b96cae05c0b7e6a7f2f7d3c9d4e748be3d3906c02',
};
const run = (command, args) => execFileSync(command, args, { cwd: root, stdio: 'inherit' });

mkdirSync(target, { recursive: true });
const staging = mkdtempSync(path.join(target, 'installer-'));
try {
  const node = downloadArchive(`${distribution}.tar.gz`,
    `https://nodejs.org/dist/${nodeVersion}/${distribution}.tar.gz`, nodeChecksums[nodeArch]);
  run('tar', ['-xzf', node, '-C', staging, `${distribution}/bin/node`, `${distribution}/LICENSE`]);

  const codexAsset = `codex-package-${codexTarget}.tar.gz`;
  const codex = downloadArchive(`codex-${codexVersion}-${codexTarget}.tar.gz`,
    `https://releases.openai.com/codex/releases/${codexVersion}/${codexAsset}`, codexChecksums[nodeArch]);
  const codexPackage = path.join(staging, 'codex');
  mkdirSync(codexPackage);
  run('tar', ['-xzf', codex, '-C', codexPackage]);
  const manifest = JSON.parse(readFileSync(path.join(codexPackage, 'codex-package.json'), 'utf8'));
  if (manifest.version !== codexVersion || manifest.target !== codexTarget || manifest.entrypoint !== 'bin/codex') {
    throw new Error('Unexpected Codex package layout');
  }

  const deployed = path.join(staging, 'sidecar');
  run('pnpm', ['--filter', 'herdsman-agent', '--config.node-linker=hoisted',
    '--config.cpu=' + nodeArch, 'deploy', '--legacy', '--prod', deployed]);

  const runtime = path.join(staging, distribution);
  for (const [source, name] of [
    [runtime, 'installer-runtime'],
    [deployed, 'installer-sidecar'],
    [codexPackage, 'installer-codex'],
  ]) {
    const destination = path.join(target, name);
    rmSync(destination, { recursive: true, force: true });
    renameSync(source, destination);
  }
} finally {
  rmSync(staging, { recursive: true, force: true });
}

function downloadArchive(filename, url, checksum) {
  const archive = path.join(target, filename);
  function matches(file) {
    try {
      return createHash('sha256').update(readFileSync(file)).digest('hex') === checksum;
    } catch (error) {
      if (error.code === 'ENOENT') return false;
      throw error;
    }
  }
  if (!matches(archive)) {
    const download = path.join(staging, filename);
    run('curl', ['--fail', '--silent', '--show-error', '--location', '--output', download, url]);
    if (!matches(download)) throw new Error(`Checksum mismatch for ${filename}`);
    renameSync(download, archive);
  }
  return archive;
}
