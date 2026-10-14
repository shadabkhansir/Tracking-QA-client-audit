// Rules engine: turns raw hits + page probe into scored findings.
// Pure module (no chrome.* APIs) so it is unit-tested under node.
import { PLATFORM_LABELS, AD_PIXELS } from './detectors.js';
import { validateGa4, validateMeta, validateTiktok, validateDataLayer, validateCookies, validateRecorders, validateCrossPlatform } from './validators.js';

export const SEVERITY = { critical: 'critical', warning: 'warning', info: 'info', pass: 'pass' };
const PENALTY = { critical: 15, warning: 6, info: 0, pass: 0 };

const EMAIL_RE = /[A-Z0-9._%+-]+(?:@|%40)[A-Z0-9.-]+\.[A-Z]{2,}/i;
const SHA256_RE = /^[a-f0-9]{64}$/i;
const PAGE_VIEW_EVENTS = { ga4: 'page_view', meta: 'PageView', tiktok: 'Pageview', snapchat: 'PAGE_VIEW', reddit: 'PageVisit', x: 'pageview', uet: 'pageLoad', pinterest: 'pagevisit' };
const GOOGLE_CONSENT_PLATFORMS = new Set(['ga4', 'gads']);
const V2_SIGNALS = ['ad_user_data', 'ad_personalization'];
export const CONSENT_SIGNALS = ['ad_storage', 'analytics_storage', ...V2_SIGNALS];

function finding(id, severity, title, detail, fix, extra = {}) {
  return { id, severity, title, detail, fix, ...extra };
}

function decode(v) {
  try { return decodeURIComponent(String(v)); } catch { return String(v); }
}

function groupBy(arr, keyFn) {
  const m = new Map();
  for (const x of arr) {
    const k = keyFn(x);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(x);
  }
  return m;
}

// Reads gtag consent commands out of dataLayer and where they sit relative to the first gtag config/event.
export function readDataLayerConsent(dataLayer) {
  const out = { defaults: [], updates: [], defaultIndex: -1, firstTagCommandIndex: -1 };
  (dataLayer || []).forEach((entry, i) => {
    const args = entry && entry.__gtag;
    if (!args) return;
    if (args[0] === 'consent' && args[1] === 'default') {
      out.defaults.push(args[2] || {});
      if (out.defaultIndex < 0) out.defaultIndex = i;
    } else if (args[0] === 'consent' && args[1] === 'update') {
      out.updates.push(args[2] || {});
    } else if ((args[0] === 'config' || args[0] === 'event') && out.firstTagCommandIndex < 0) {
      out.firstTagCommandIndex = i;
    }
  });
  return out;
}

// Merges every consent source into one view: Google runtime state > hit params > dataLayer commands.
export function resolveConsent(hits, probe, dlLog = []) {
  const googleHits = hits.filter(h => h.kind === 'hit' && GOOGLE_CONSENT_PLATFORMS.has(h.platform));
  const withConsent = googleHits.filter(h => h.consent);
  // The live push log survives a page overwriting window.dataLayer; the probe snapshot does not.
  const logged = (dlLog || []).filter(e => e.type === 'push').map(e => e.entry);
  const dl = readDataLayerConsent(logged.length ? logged : probe?.dataLayer);
  const entries = probe?.consentState?.entries || {};
  const signals = {};
  for (const s of CONSENT_SIGNALS) {
    const e = entries[s];
    const latestHit = [...withConsent].reverse().find(h => h.consent.gcdParsed?.[s]);
    const dlDefault = dl.defaults.find(d => d[s] !== undefined)?.[s];
    const dlUpdate = [...dl.updates].reverse().find(d => d[s] !== undefined)?.[s];
    const def = e?.default ?? latestHit?.consent.gcdParsed[s].default ?? dlDefault ?? null;
    const upd = e?.update ?? latestHit?.consent.gcdParsed[s].update ?? dlUpdate ?? null;
    signals[s] = { default: def, update: upd, effective: upd ?? def ?? 'unset' };
  }
  // gcs fills in storage signals for older tags that send gcs but not gcd.
  const latestGcs = [...withConsent].reverse().find(h => h.consent.gcsParsed)?.consent.gcsParsed;
  if (latestGcs) {
    for (const s of ['ad_storage', 'analytics_storage']) {
      if (signals[s].effective === 'unset' && latestGcs[s] !== 'unset') signals[s].effective = latestGcs[s];
    }
  }
  const anySignal = Object.values(signals).some(s => s.default || s.update || s.effective !== 'unset');
  return {
    implemented: anySignal || Object.keys(entries).length > 0 || dl.defaults.length > 0,
    signals,
    wasSetLate: probe?.consentState?.wasSetLate === true,
    dataLayer: dl,
    googleHitCount: googleHits.length,
    hitsWithConsentParams: withConsent.length,
    cmps: probe?.cmps || [],
  };
}

export function summarize(hits, probe) {
  const platforms = {};
  const add = (platform, id) => {
    platforms[platform] ??= { label: PLATFORM_LABELS[platform] || platform, ids: new Set(), scripts: 0, hits: 0, events: {} };
    if (id) platforms[platform].ids.add(String(id));
    return platforms[platform];
  };
  for (const h of hits) {
    const p = add(h.platform, h.id);
    if (h.kind === 'script') p.scripts++;
    else {
      p.hits++;
      const ev = h.event || '(unnamed)';
      p.events[ev] = (p.events[ev] || 0) + 1;
    }
  }
  for (const id of probe?.googleTagIds || []) add(id.startsWith('GTM-') ? 'gtm' : id.startsWith('G-') ? 'ga4' : id.startsWith('AW-') ? 'gads' : 'google_tag', id);
  for (const id of probe?.metaPixels?.ids || []) add('meta', id);
  for (const id of probe?.tiktokPixels?.ids || []) add('tiktok', id);
  if (probe?.metaPixels && !platforms.meta) add('meta');
  if (probe?.tiktokPixels && !platforms.tiktok) add('tiktok');
  for (const p of Object.values(platforms)) p.ids = [...p.ids].sort();
  return platforms;
}

/**
 * @param {{url: string, hits: object[], probe: object|null}} input
 */
/**
 * @param {object} input
 * @param {object[]} [input.postHits] hits captured after an automated consent accept (event validation only)
 * @param {object[]} [input.dlLog] live dataLayer push log from the content script
 * @param {object} [input.consentTest] before/after consent comparison
 */
export function runChecks({ url, hits = [], probe = null, postHits = [], dlLog = [], consentTest = null }) {
  const findings = [];
  const platforms = summarize(hits, probe);
  const consent = resolveConsent(hits, probe, dlLog);
  const tagHits = hits.filter(h => h.kind === 'hit');
  const hasGoogle = !!(platforms.ga4 || platforms.gtm || platforms.gads || platforms.google_tag);
  const hasAdPixels = AD_PIXELS.some(p => platforms[p]);

  if (!Object.keys(platforms).length) {
    findings.push(finding('no-tracking', SEVERITY.warning, 'No tracking detected',
      'No GA4, GTM, Google Ads, Meta or TikTok tags were seen on this page load.',
      'Reload the page with the panel open. If tags load only after consent, accept the banner and re-run. If nothing appears, tracking is not installed or is blocked.'));
  }

  // --- Duplicate page views -------------------------------------------------------------
  for (const [platform, eventName] of Object.entries(PAGE_VIEW_EVENTS)) {
    const pv = tagHits.filter(h => h.platform === platform && h.event === eventName);
    const byKey = groupBy(pv, h => `${h.id}|${platform === 'ga4' ? (h.params.dl || '') : (h.params.dl || h.params['context.page.url'] || h.params.p || h.params.url || '')}`);
    let dupes = false;
    for (const [key, list] of byKey) {
      if (list.length > 1) {
        dupes = true;
        const id = key.split('|')[0];
        findings.push(finding(`duplicate-pageview-${platform}`, SEVERITY.critical,
          `${PLATFORM_LABELS[platform]} fires ${eventName} ${list.length}× for ${id}`,
          `The same page URL sent ${list.length} ${eventName} events to ${id}. Sessions, users and conversion rates will be inflated.`,
          platform === 'ga4'
            ? 'Usually a hardcoded gtag.js snippet plus a GA4 tag in GTM, or two GTM page_view triggers. Keep one source and remove the other.'
            : `Usually the pixel base code is installed twice (theme + plugin/GTM). Keep a single base code and a single ${eventName}.`,
          { platform, tagId: id }));
      }
    }
    if (pv.length && !dupes) {
      findings.push(finding(`single-pageview-${platform}`, SEVERITY.pass, `${PLATFORM_LABELS[platform]}: one ${eventName} per page`, '', '', { platform }));
    }
  }

  // --- Loaded but silent ----------------------------------------------------------------
  const ga4Scripts = hits.filter(h => h.kind === 'script' && h.platform === 'ga4').map(h => h.id);
  for (const id of new Set(ga4Scripts)) {
    if (!tagHits.some(h => h.platform === 'ga4' && h.id === id)) {
      const denied = consent.signals.analytics_storage.effective === 'denied';
      findings.push(finding('ga4-silent', denied ? SEVERITY.info : SEVERITY.warning, `GA4 ${id} loaded but sent no hits`,
        denied
          ? 'analytics_storage is denied, so this is expected under Basic Consent Mode. Under Advanced mode you would still see cookieless pings.'
          : 'gtag.js loaded for this ID but no /g/collect request was observed.',
        denied ? 'Accept analytics consent and re-run to confirm hits flow once granted.' : 'Check that a config command or GA4 tag fires for this ID, and that the measurement ID matches the property.',
        { platform: 'ga4', tagId: id }));
    }
  }
  for (const p of AD_PIXELS) {
    if (platforms[p] && platforms[p].scripts > 0 && !tagHits.some(h => h.platform === p)) {
      findings.push(finding(`${p}-silent`, SEVERITY.warning, `${PLATFORM_LABELS[p]} loaded but sent no events`,
        'The pixel library loaded but no tracking requests were observed.',
        'Confirm the init and page-view calls run. If the pixel waits for consent, that is correct before consent; run the consent test to confirm it fires after.', { platform: p }));
    }
  }
  // Meta/TikTok objects can exist without a separate library request (inline or cached), so check those too.
  for (const p of ['meta', 'tiktok']) {
    if (platforms[p] && !platforms[p].scripts && !tagHits.some(h => h.platform === p) && !findings.some(f => f.id === `${p}-silent`)) {
      findings.push(finding(`${p}-silent`, SEVERITY.warning, `${PLATFORM_LABELS[p]} loaded but sent no events`,
        'The pixel is on the page but no tracking requests were observed.',
        'Confirm the init and page-view calls run. If the pixel waits for consent, run the consent test to confirm it fires after.', { platform: p }));
    }
  }

  const sgtmHosts = [...new Set(tagHits.filter(h => h.platform === 'ga4' && h.serverSide).map(h => { try { return new URL(h.url).hostname; } catch { return ''; } }).filter(Boolean))];
  if (sgtmHosts.length) {
    findings.push(finding('sgtm-detected', SEVERITY.pass, `Server-side GTM detected (${sgtmHosts.join(', ')})`,
      'GA4 hits go to a first-party server container instead of Google directly, which is more resilient to ad blockers and browser cookie limits.', ''));
  }

  // --- Multiple containers / properties ------------------------------------------------
  if (platforms.gtm && platforms.gtm.ids.length > 1) {
    findings.push(finding('multiple-gtm', SEVERITY.info, `${platforms.gtm.ids.length} GTM containers on the page`,
      `Containers: ${platforms.gtm.ids.join(', ')}. Legitimate for agency/client splits, but a common source of duplicate tags.`,
      'Confirm each container has a distinct owner and that no tag is configured in both.', { platform: 'gtm' }));
  }
  if (platforms.ga4 && platforms.ga4.ids.length > 1) {
    findings.push(finding('multiple-ga4', SEVERITY.info, `${platforms.ga4.ids.length} GA4 measurement IDs`,
      `IDs: ${platforms.ga4.ids.join(', ')}. Fine for roll-up properties; otherwise data is being split or sent to an old property.`,
      'Confirm every ID belongs to a property the client still uses.', { platform: 'ga4' }));
  }

  // --- Consent Mode ---------------------------------------------------------------------
  if (hasGoogle) {
    if (!consent.implemented) {
      findings.push(finding('consent-missing', SEVERITY.critical, 'Google Consent Mode not implemented',
        'Google tags run without any consent signals. Since March 2024 Google requires Consent Mode v2 for ad personalization and remarketing on EEA/UK traffic.',
        'Add a consent default (all denied for EEA/UK) before any Google tag fires, and wire your CMP to send consent updates. Most CMPs have a GTM template that does both.'));
    } else {
      const missingV2 = V2_SIGNALS.filter(s => consent.signals[s].default === null && consent.signals[s].update === null);
      if (missingV2.length) {
        findings.push(finding('consent-v1-only', SEVERITY.critical, 'Consent Mode v1 only: v2 signals missing',
          `Not set: ${missingV2.join(', ')}. Without these, Google Ads treats EEA/UK users as non-consented for audiences and personalization.`,
          'Add ad_user_data and ad_personalization to both the consent default and the CMP update. Updating the CMP template usually fixes this.'));
      } else {
        findings.push(finding('consent-v2', SEVERITY.pass, 'Consent Mode v2 signals present', '', ''));
      }

      const updateWithoutDefault = tagHits.some(h => {
        const g = h.consent?.gcdParsed;
        return g && ['ad_storage', 'analytics_storage'].some(s => g[s].default === null && g[s].update !== null);
      });
      const dl = consent.dataLayer;
      const dlLate = dl.defaultIndex > -1 && dl.firstTagCommandIndex > -1 && dl.defaultIndex > dl.firstTagCommandIndex;
      if (consent.wasSetLate || updateWithoutDefault || dlLate) {
        findings.push(finding('consent-default-late', SEVERITY.critical, 'Consent default is set too late (or not at all)',
          updateWithoutDefault
            ? 'Hits carry a consent update but no default, so tags fired before any default existed.'
            : 'The consent default runs after Google tags have already been configured.',
          'Move the consent default above the GTM/gtag snippet, or fire the CMP template on the "Consent Initialization – All Pages" trigger.'));
      }

      const adDefault = consent.signals.ad_storage.default;
      if (adDefault === 'granted' && consent.cmps.length) {
        findings.push(finding('consent-default-granted', SEVERITY.warning, 'ad_storage defaults to granted',
          'A CMP is present but Google tags start with ad consent granted. Compliant only if this default is region-scoped to non-EEA/UK visitors.',
          'Set a denied default for EEA/UK (gtag consent default with a region parameter) and verify from an EEA IP or VPN.'));
      }
    }
  }

  // Non-Google pixels have no Consent Mode; they must be gated by the CMP itself.
  if (hasAdPixels && consent.signals.ad_storage.effective === 'denied') {
    const firing = AD_PIXELS.filter(p => tagHits.some(h => h.platform === p));
    if (firing.length) {
      findings.push(finding('pixels-ignore-consent', SEVERITY.critical, `${firing.map(p => PLATFORM_LABELS[p]).join(' and ')} ${firing.length > 1 ? 'fire' : 'fires'} while ad consent is denied`,
        'Google tags see ad_storage = denied, yet these pixels still send events. Consent Mode only governs Google tags; other pixels must be blocked by the CMP.',
        'Fire these pixels from GTM with "Additional consent checks" requiring ad_storage, or use the CMP\'s script blocking / fbq("consent","revoke") until consent is given.'));
    }
  }

  // --- PII leakage ----------------------------------------------------------------------
  const piiHits = [];
  for (const h of tagHits) {
    for (const [k, v] of Object.entries(h.params || {})) {
      if (v === null || v === undefined) continue;
      const val = decode(v);
      // Meta Advanced Matching: user data must be SHA-256 hashed when sent from the browser.
      if (h.platform === 'meta' && /^ud\[/.test(k)) {
        if (val && !SHA256_RE.test(val)) piiHits.push({ platform: h.platform, id: h.id, param: k, reason: 'unhashed advanced-matching field' });
        continue;
      }
      if (EMAIL_RE.test(val)) piiHits.push({ platform: h.platform, id: h.id, param: k, reason: 'email address in payload' });
    }
  }
  if (piiHits.length) {
    const uniq = [...new Map(piiHits.map(p => [`${p.platform}|${p.param}`, p])).values()];
    findings.push(finding('pii-leak', SEVERITY.critical, 'Personal data sent to ad/analytics platforms',
      `Found in: ${uniq.map(p => `${PLATFORM_LABELS[p.platform]} → ${p.param} (${p.reason})`).join('; ')}. Values are not stored in this report.`,
      'Strip emails from URLs (forms often use GET), page titles and event parameters. Hash Meta advanced-matching fields or let the pixel hash them. GA4 sending PII violates Google\'s terms and can get the property deleted.',
      { pii: uniq }));
  } else if (tagHits.length) {
    findings.push(finding('no-pii', SEVERITY.pass, 'No personal data detected in tracking payloads', '', ''));
  }

  // --- Event / ecommerce validation, dataLayer hygiene, cookies --------------------------
  const allHits = [...tagHits, ...postHits.filter(h => h.kind === 'hit')];
  findings.push(...validateGa4(allHits), ...validateMeta(allHits), ...validateTiktok(allHits), ...validateCrossPlatform(allHits));
  findings.push(...validateDataLayer(dlLog, probe));
  findings.push(...validateCookies(probe, consent.signals));
  findings.push(...validateRecorders(hits, consent.signals));
  if (consentTest) findings.push(...consentTestFindings(consentTest));
  const hasEcom = allHits.some(h => ['purchase', 'Purchase', 'CompletePayment', 'add_to_cart', 'AddToCart'].includes(h.event));
  if (hasEcom && !findings.some(f => /ecom|purchase|value|currency|content-id|item/.test(f.id) && f.severity !== 'pass')) {
    findings.push(finding('ecommerce-valid', SEVERITY.pass, 'Ecommerce events carry value, currency and items', '', ''));
  }

  const scoreable = findings.filter(f => f.severity !== SEVERITY.pass);
  const score = Math.max(0, 100 - scoreable.reduce((s, f) => s + PENALTY[f.severity], 0));
  const order = { critical: 0, warning: 1, info: 2, pass: 3 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);

  return {
    url,
    title: probe?.title || '',
    score,
    findings,
    platforms,
    consent: { implemented: consent.implemented, signals: consent.signals, cmps: consent.cmps, wasSetLate: consent.wasSetLate },
    consentTest,
    counts: {
      critical: findings.filter(f => f.severity === 'critical').length,
      warning: findings.filter(f => f.severity === 'warning').length,
      info: findings.filter(f => f.severity === 'info').length,
      pass: findings.filter(f => f.severity === 'pass').length,
    },
  };
}

// Findings from the automated "accept all" consent test.
export function consentTestFindings(t) {
  const out = [];
  if (!t.attempted) return out;
  const verb = t.mode === 'reject' ? 'reject' : 'accept';
  if (!t.accepted) {
    out.push(finding('consent-test-skipped', SEVERITY.info, `Consent banner could not be ${verb}ed automatically`,
      t.reason || 'No supported consent platform or button was found.',
      `${verb === 'reject' ? 'Reject' : 'Accept'} the banner by hand with the panel open and run the audit again.`));
    return out;
  }
  const after = t.signalsAfter || {};
  const newlyFiring = Object.keys(t.after || {}).filter(p => AD_PIXELS.includes(p) && t.after[p] > 0);

  if (t.mode === 'reject') {
    const granted = ['ad_storage', 'analytics_storage', 'ad_user_data', 'ad_personalization'].filter(s => after[s]?.effective === 'granted');
    if (newlyFiring.length) {
      out.push(finding('pixels-fire-after-reject', SEVERITY.critical, `${newlyFiring.map(p => PLATFORM_LABELS[p]).join(', ')} fire after the visitor rejects cookies`,
        'The visitor clicked "reject all" and these pixels still sent data. This is the exact behaviour EU regulators fine for.',
        'Block these tags unless marketing consent is granted (GTM consent checks or CMP script blocking).'));
    }
    if (t.googlePresent && granted.length) {
      out.push(finding('consent-granted-after-reject', SEVERITY.critical, 'Google consent is granted after "reject all"',
        `After rejecting, ${granted.join(', ')} report granted. Google tags will set cookies and personalise ads without consent.`,
        'Make the CMP send gtag("consent","update", {...denied}) on reject, and check the default is denied for EEA/UK.'));
    }
    if (!newlyFiring.length && !(t.googlePresent && granted.length)) {
      out.push(finding('reject-respected', SEVERITY.pass, 'Rejecting cookies stops ad tracking', '', ''));
    }
    return out;
  }

  const stillDenied = ['ad_storage', 'analytics_storage'].filter(s => after[s] && after[s].effective !== 'granted');
  if (t.googlePresent && stillDenied.length) {
    out.push(finding('consent-update-missing', SEVERITY.critical, 'Accepting cookies does not update Google consent',
      `After "accept all", ${stillDenied.join(' and ')} stayed ${stillDenied.map(s => after[s].effective).join('/')}. Google tags keep running in restricted mode, so conversions and remarketing are lost even for users who agreed.`,
      'Make the CMP send gtag("consent","update", {...granted}) on accept. Most CMP GTM templates do this when "Google Consent Mode" is enabled in the CMP settings.'));
  }
  const waited = newlyFiring.filter(p => !(t.before || {})[p]);
  if (waited.length) out.push(finding('pixels-wait-for-consent', SEVERITY.pass, `${waited.map(p => PLATFORM_LABELS[p]).join(', ')} wait for consent`, '', ''));
  const silent = (t.loadedPlatforms || []).filter(p => !(t.after || {})[p] && !(t.before || {})[p]);
  if (silent.length) {
    out.push(finding('tags-silent-after-consent', SEVERITY.warning, `${silent.map(p => PLATFORM_LABELS[p] || p).join(', ')} still silent after consent`,
      'Even with full consent these tags loaded but never sent data. You lose this data for every visitor.',
      'Check the tag triggers and that the CMP fires the consent event GTM listens for.'));
  }
  return out;
}

// Rolls page-level results into one site report for multi-page scans.
export function aggregatePages(pageResults) {
  const byId = new Map();
  // Pages without a banner can't run the consent test; that's only worth reporting if no page could.
  const anyAccepted = pageResults.some(p => p.consentTest?.accepted);
  for (const page of pageResults) {
    for (const f of page.findings) {
      if (anyAccepted && f.id === 'consent-test-skipped') continue;
      const key = `${f.id}|${f.title}`;
      if (!byId.has(key)) byId.set(key, { ...f, pages: [] });
      byId.get(key).pages.push(page.url);
    }
  }
  const findings = [...byId.values()];
  const order = { critical: 0, warning: 1, info: 2, pass: 3 };
  findings.sort((a, b) => order[a.severity] - order[b.severity] || b.pages.length - a.pages.length);
  // A pass only counts site-wide if every page passed it.
  const sitewide = findings.filter(f => f.severity !== 'pass' || f.pages.length === pageResults.length);
  const score = pageResults.length ? Math.round(pageResults.reduce((s, p) => s + p.score, 0) / pageResults.length) : 0;
  const platforms = {};
  for (const page of pageResults) {
    for (const [k, p] of Object.entries(page.platforms)) {
      platforms[k] ??= { label: p.label, ids: new Set(), pages: 0 };
      p.ids.forEach(id => platforms[k].ids.add(id));
      platforms[k].pages++;
    }
  }
  for (const p of Object.values(platforms)) p.ids = [...p.ids].sort();
  return {
    score,
    findings: sitewide,
    platforms,
    counts: {
      critical: sitewide.filter(f => f.severity === 'critical').length,
      warning: sitewide.filter(f => f.severity === 'warning').length,
      info: sitewide.filter(f => f.severity === 'info').length,
      pass: sitewide.filter(f => f.severity === 'pass').length,
    },
  };
}
