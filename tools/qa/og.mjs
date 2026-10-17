import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader'] });
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await p.addStyleTag({ content: 'nextjs-portal, [data-nextjs-toast]{display:none!important} html{scrollbar-gutter:auto!important;scrollbar-width:none!important}' });
await p.waitForTimeout(1500);
await p.screenshot({ path: 'public/og.jpg', type: 'jpeg', quality: 86 });
await b.close();
