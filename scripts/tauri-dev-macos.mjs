import { execFileSync, spawn } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, renameSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

const [binary, ...args] = process.argv.slice(2);
const { productName, identifier } = JSON.parse(
  readFileSync(new URL('../src-tauri/tauri.dev.conf.json', import.meta.url), 'utf8'),
);
const contents = join(dirname(binary), `${productName}.app`, 'Contents');
const executable = basename(binary);
const bundleBinary = join(contents, 'MacOS', executable);
mkdirSync(dirname(bundleBinary), { recursive: true });
execFileSync('/usr/bin/plutil', ['-convert', 'xml1', '-o', join(contents, 'Info.plist'), '--', '-'], {
  input: JSON.stringify({
    CFBundleIdentifier: identifier,
    CFBundleName: productName,
    CFBundleDisplayName: productName,
    CFBundleExecutable: executable,
    CFBundlePackageType: 'APPL',
  }),
});

const stagedBinary = `${bundleBinary}.${process.pid}.tmp`;
copyFileSync(binary, stagedBinary);
renameSync(stagedBinary, bundleBinary);

const child = spawn(bundleBinary, args, { stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
