// Per-vendor consent timeline: what each vendor sent before the visitor's banner choice and after it, with a verdict.
// Rules: docs/SPEC.md §3 and docs/research/PLATFORM-SPECS.md §2–4. Only Google (gcs/gcd) and Microsoft UET (asc)
// carry a consent value on the wire; every other vendor is judged by timing against the choice.
import { PLATFORM_LABELS } from './detectors.js';

const GOOGLE = new Set(['ga4', 'gads', 'floodlight']);
// Vendors with no consent signal on the wire: any hit before the choice (with a banner present) is a pre-consent fire.
const TIMING_ONLY = new Set(['meta', 'tiktok', 'linkedin', 'pinterest', 'snapchat', 'x', 'reddit', 'hotjar', 'openai']);
const ORDER = ['ga4', 'gads', 'floodlight', 'uet', 'meta', 'tiktok', 'linkedin', 'x', 'pinterest', 'snapchat', 'reddit', 'openai', 'clarity', 'hotjar'];

export const VERDICT = {
  pass: { label: 'Pass', severity: 'pass' },
  before: { label: 'Fired before consent', severity: 'critical' },
  afterReject: { label: 'Fired after reject', severity: 'critical' },
  noSignal: { label: 'No consent signal', severity: 'warning' },
  updateMissing: { label: 'Consent update missing', severity: 'warning' },
  cookieless: { label: 'Cookieless mode', severity: 'info' },
  noBanner: { label: 'No banner to wait for', severity: 'info' },
  unknown: { label: 'Run banner test', severity: 'info' },
};

function googleAd(h) {
  const c = h.consent;
  if (!c) return null;
  return c.gcdParsed?.ad_storage?.effective && !['unset', 'unknown'].includes(c.gcdParsed.ad_storage.effective)
    ? c.gcdParsed.ad_storage.effective
    : c.gcsParsed?.ad_storage && c.gcsParsed.ad_storage !== 'unset' ? c.gcsParsed.ad_storage : null;
}

function signalOf(platform, hits) {
  if (GOOGLE.has(platform)) {
    const s = [...new Set(hits.map(googleAd).filter(Boolean))];
    return s.length ? `ad_storage ${s.join('/')}` : null;
  }
  if (platform === 'uet') {
    const s = [...new Set(hits.map(h => h.consent?.uet || (h.params?.tcf ? 'tcf' : 'none')))];
    return `asc ${s.map(v => ({ granted: 'G', denied: 'D', none: 'missing', tcf: 'TCF', unset: '?' })[v] || v).join('/')}`;
  }
  return null;
}

// hits: before the choice (or the whole page if no test); postHits: after the choice.
// test: { mode: 'accept'|'reject', accepted, tChoice } or null. cmps: detected consent platforms.
export function buildConsentTimeline({ hits = [], postHits = [], test = null, cmps = [], t0 = null }) {
  const tagHits = hits.filter(h => h.kind === 'hit' && !h.internal);
  const after = (test?.accepted && test.mode !== 'gpc') ? postHits.filter(h => h.kind === 'hit' && !h.internal) : [];
  const mode = test?.accepted && test.mode !== 'gpc' ? test.mode : null;
  const banner = cmps.length > 0 || !!mode;
  const start = t0 || Math.min(...tagHits.map(h => h.ts || Infinity), ...after.map(h => h.ts || Infinity));
  // Without a banner test we can't know whether this visitor already chose. Treat "no choice yet" as known only when
  // the wire says consent is denied (Google ad_storage denied and never granted, or UET asc=D).
  const deniedOnWire = tagHits.some(h => googleAd(h) === 'denied' || h.consent?.uet === 'denied') && !tagHits.some(h => googleAd(h) === 'granted' || h.consent?.uet === 'granted');
  const platforms = ORDER.filter(p => tagHits.some(h => h.platform === p) || after.some(h => h.platform === p));

  const vendors = platforms.map(platform => {
    const pre = tagHits.filter(h => h.platform === platform);
    const post = after.filter(h => h.platform === platform);
    const first = pre.length ? Math.min(...pre.map(h => h.ts || start)) : null;
    const row = {
      platform,
      label: PLATFORM_LABELS[platform] || platform,
      before: pre.length,
      after: post.length,
      firstMs: first !== null && Number.isFinite(start) ? Math.max(0, first - start) : null,
      signalBefore: signalOf(platform, pre),
      signalAfter: post.length ? signalOf(platform, post) : null,
      verdict: 'pass',
      note: '',
    };

    if (!banner) {
      row.verdict = pre.length || post.length ? 'noBanner' : 'pass';
      row.note = 'No consent banner was detected, so there was no choice to wait for.';
      return row;
    }

    if (GOOGLE.has(platform)) {
      const grantedBefore = pre.some(h => googleAd(h) === 'granted');
      const grantedAfter = post.some(h => googleAd(h) === 'granted');
      if (mode === 'reject' && grantedAfter) { row.verdict = 'afterReject'; row.note = 'Google tags report ad_storage granted after "reject all".'; }
      // Without a banner test, granted may be this visitor's stored choice (granted defaults are caught by consent-default-granted).
      else if (grantedBefore && !mode) { row.verdict = 'unknown'; row.note = 'ad_storage is granted: either this visitor already accepted or the default is granted. Run the cookie banner test as a fresh visitor.'; }
      else if (grantedBefore) { row.verdict = 'before'; row.note = 'ad_storage was already granted before the visitor chose (granted default).'; }
      else if (pre.length && !pre.some(googleAd)) { row.verdict = 'noSignal'; row.note = 'Google hits carry no Consent Mode state while a banner is present.'; }
      else if (mode === 'accept' && post.length && !grantedAfter) { row.verdict = 'updateMissing'; row.note = 'After "accept all", hits still show ad_storage denied: the consent update is not reaching Google.'; }
      else row.note = pre.length ? 'Cookieless pings with consent denied (Advanced Consent Mode) are allowed.' : '';
      return row;
    }

    if (platform === 'uet') {
      const asc = h => h.consent?.uet || null;
      if (mode === 'reject' && post.some(h => asc(h) === 'granted')) { row.verdict = 'afterReject'; row.note = 'UET sends asc=G after "reject all".'; }
      else if (pre.some(h => asc(h) === 'granted') && !mode) { row.verdict = 'unknown'; row.note = 'UET sends asc=G: either this visitor already accepted or the default is granted. Run the cookie banner test as a fresh visitor.'; }
      else if (pre.some(h => asc(h) === 'granted')) { row.verdict = 'before'; row.note = 'UET sent asc=G before the visitor chose: the default is granted or not set.'; }
      else if ([...pre, ...post].some(h => !asc(h) && !h.params?.tcf)) { row.verdict = 'noSignal'; row.note = 'UET hits have no asc parameter, so Microsoft Ads receives no consent signal. Required for EEA/UK/CH traffic since 5 May 2025.'; }
      else if (mode === 'accept' && post.length && !post.some(h => asc(h) === 'granted')) { row.verdict = 'updateMissing'; row.note = 'After "accept all", UET still sends asc=D: add uetq.push("consent","update",{ad_storage:"granted"}).'; }
      else row.note = pre.length ? 'UET waited with asc=D (Microsoft\'s consent mode).' : '';
      return row;
    }

    if (platform === 'clarity') {
      row.verdict = pre.length ? 'cookieless' : 'pass';
      row.note = pre.length ? 'Clarity can run without cookies before consent (no-consent mode). Confirm it calls clarity("consentv2", …) on the choice; enforced in EEA/UK/CH since 31 Oct 2025.' : '';
      return row;
    }

    if (TIMING_ONLY.has(platform)) {
      if (!mode && pre.length && !deniedOnWire) { row.verdict = 'unknown'; row.note = 'A banner is present but this visitor may already have chosen. Run the cookie banner test (Reject all) as a fresh visitor for a verdict.'; }
      else if (mode === 'reject' && post.length) { row.verdict = 'afterReject'; row.note = 'Sent data after the visitor rejected cookies.'; }
      else if (pre.length) { row.verdict = 'before'; row.note = mode ? 'Sent data before the visitor made a choice.' : 'Sent data while the banner was still waiting for a choice.'; }
      else row.note = post.length ? 'Waited for consent.' : '';
    }
    return row;
  });

  return {
    t0: Number.isFinite(start) ? start : null,
    tChoice: mode ? test.tChoice || null : null,
    choiceMs: mode && test.tChoice && Number.isFinite(start) ? Math.max(0, test.tChoice - start) : null,
    mode,
    cmp: cmps[0] || null,
    banner,
    vendors,
  };
}

export function timelineFindings(tl) {
  if (!tl || !tl.banner) return [];
  const out = [];
  const by = v => tl.vendors.filter(r => r.verdict === v);
  const names = rows => rows.map(r => r.label).join(', ');
  const legal = 'Under GDPR/UK PECR, non-essential tracking needs consent first; several US states require honouring opt-outs (GPC); India\'s DPDP Rules phase in consent duties (core duties from May 2027). This is a technical check, not legal advice.';
  const rejected = by('afterReject');
  const early = by('before');
  if (rejected.length || early.length) {
    out.push({
      id: 'consent-timeline-fail',
      severity: 'critical',
      title: rejected.length ? `${names(rejected)} ${rejected.length > 1 ? 'track' : 'tracks'} after the visitor rejects cookies` : `${names(early)} ${early.length > 1 ? 'fire' : 'fires'} before the visitor accepts cookies`,
      detail: `${rejected.length ? `After reject: ${names(rejected)}. ` : ''}${early.length ? `Before any choice: ${names(early)}. ` : ''}${legal}`,
      fix: 'Block these tags until consent: in GTM add consent checks (ad_storage / analytics_storage) to each tag, or let the CMP block the scripts. For UET push uetq consent default denied; for ChatGPT Ads call oaiq("consent", false) before init; for TikTok call ttq.holdConsent().',
      vendors: [...rejected, ...early].map(r => r.platform),
    });
  }
  const noSignal = by('noSignal');
  if (noSignal.some(r => r.platform === 'uet')) {
    out.push({ id: 'uet-consent-missing', severity: 'warning', title: 'Microsoft Ads (UET) receives no consent signal',
      detail: 'A consent banner is present, but UET hits carry no asc parameter. Microsoft requires UET Consent Mode for EEA, UK and Swiss traffic (since 5 May 2025), and conversions can be lost without it.',
      fix: 'Add window.uetq.push("consent", "default", { ad_storage: "denied" }) before UET loads and push "update" with "granted" when the visitor accepts. Many CMPs have a Microsoft UET toggle.' });
  }
  if (noSignal.some(r => GOOGLE.has(r.platform))) {
    out.push({ id: 'google-consent-signal-missing', severity: 'warning', title: 'Google tags send no Consent Mode state although a banner is present',
      detail: 'Google hits have no gcs/gcd consent values, so the banner is not connected to Consent Mode.',
      fix: 'Enable the CMP\'s Google Consent Mode integration (consent default before tags load, update on choice).' });
  }
  const upd = by('updateMissing');
  if (upd.length) {
    out.push({ id: 'consent-update-missing', severity: 'warning', title: `Consent update does not reach ${names(upd)}`,
      detail: 'The visitor accepted, but these tags still report consent denied. Conversions and remarketing are lost for consenting visitors.',
      fix: 'Send the consent update on accept (gtag("consent","update",…) / uetq.push("consent","update",…)); check the CMP\'s Google and Microsoft integrations.' });
  }
  if (!out.length && tl.vendors.length && tl.mode) {
    out.push({ id: 'consent-timeline-pass', severity: 'pass', title: 'Every vendor waits for the cookie banner choice', detail: '', fix: '' });
  }
  return out;
}
