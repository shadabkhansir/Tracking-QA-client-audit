// Live check against Dodo Payments test mode: activate → validate → deactivate a real test key with the shipped
// config (src/license-config.js). Run: npm run test:license [-- <key>]. Needs network; not part of npm test.
import { activateLicense, revalidateIfDue, deactivateLicense } from '../src/license.js';
import { LICENSE_CONFIG } from '../src/license-config.js';

const key = process.argv[2] || 'TGF-TEST-TAG-PRO-0001';
const mem = new Map();
const storage = { get: async k => mem.get(k), set: async (k, v) => mem.set(k, v), remove: async k => mem.delete(k) };
const fail = msg => { console.error(`FAIL ${msg}`); process.exit(1); };

if (LICENSE_CONFIG.mode !== 'test') fail('config is not in test mode; this script only uses test keys');
const a = await activateLicense(key, { storage });
if (!a.ok) fail(`activate: ${a.error}`);
console.log(`activated: ${a.state.productName} → plan ${a.state.plan}, instance ${a.state.instanceId}`);
const v = await revalidateIfDue({ storage }, { force: true });
if (!v.valid) fail('validate said not valid');
console.log('validated: still valid');
await deactivateLicense({ storage });
console.log('deactivated: activation freed');
const wrong = await activateLicense('TGF-TEST-UTM-PRO-0001', { storage });
if (wrong.ok) fail('a UTM Builder key unlocked Pixel & Tag Checker');
console.log(`other extension's key rejected: "${wrong.error}"`);
const bundle = await activateLicense('TGF-TEST-ALL-ACCESS-0001', { storage });
if (!bundle.ok) fail(`All-Access key: ${bundle.error}`);
console.log(`All-Access key accepted → plan ${bundle.state.plan}`);
await deactivateLicense({ storage });
console.log('OK');
