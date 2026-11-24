// Starts the Playwright MCP server (microsoft/playwright-mcp) for this project.
// In the cloud container the browser is pre-installed at /opt/pw-browsers/chromium, a different
// Chromium build than the one Playwright MCP would download, so point it there. On a machine
// without that path Playwright MCP uses its own browser (`npx playwright install chromium`).
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const PREINSTALLED = '/opt/pw-browsers/chromium';
const env = { ...process.env };
if (!env.PLAYWRIGHT_MCP_EXECUTABLE_PATH && existsSync(PREINSTALLED)) env.PLAYWRIGHT_MCP_EXECUTABLE_PATH = PREINSTALLED;

const args = ['-y', '@playwright/mcp@0.0.83', '--headless', '--isolated', '--output-dir', '.playwright-mcp'];
// Chromium refuses to start as root with its sandbox on; the cloud container runs as root.
if (process.platform === 'linux' && process.getuid?.() === 0) args.push('--no-sandbox');
args.push(...process.argv.slice(2));
const child = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', args, { stdio: 'inherit', env, shell: process.platform === 'win32' });
child.on('exit', (code, signal) => (signal ? process.kill(process.pid, signal) : process.exit(code ?? 0)));
