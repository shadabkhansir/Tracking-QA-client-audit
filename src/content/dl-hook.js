// MAIN world, document_start. Records every dataLayer push (and reassignment) in order,
// even pushes that happen before GTM loads or after GTM swaps in its own push().
(() => {
  if (window.__tqaHooked) return;
  window.__tqaHooked = true;
  // GPC test: the service worker sets this flag and reloads; expose the signal before any page script runs.
  try {
    if (sessionStorage.getItem('__tqa_gpc') === '1') Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', { configurable: true, get: () => true });
  } catch { /* storage blocked */ }
  const MAX_DEPTH = 4;
  const clean = (v, d = 0) => {
    if (typeof v === 'function') return '[fn]';
    if (typeof v === 'string') return v.length > 2000 ? `${v.slice(0, 2000)}…` : v;
    if (v === null || typeof v !== 'object') return v;
    if (d > MAX_DEPTH) return '[…]';
    if (v instanceof Date) return v.toISOString();
    if (typeof Node !== 'undefined' && v instanceof Node) return '[node]';
    const isArgs = Object.prototype.toString.call(v) === '[object Arguments]';
    if (Array.isArray(v) || isArgs) {
      const arr = Array.from(v).slice(0, 50).map(x => clean(x, d + 1));
      return isArgs ? { __gtag: arr } : arr;
    }
    const out = {};
    for (const k of Object.keys(v).slice(0, 60)) { try { out[k] = clean(v[k], d + 1); } catch { out[k] = '[err]'; } }
    return out;
  };
  const emit = (type, payload) => {
    try { window.postMessage({ __tqa: true, type, ts: Date.now(), ...payload }, '*'); } catch { /* uncloneable */ }
  };

  // Keeps our wrapper in front of whatever push() the page or GTM installs later.
  const hookArray = arr => {
    if (!Array.isArray(arr) || arr.__tqa) return;
    try {
      Object.defineProperty(arr, '__tqa', { value: true });
      arr.forEach(e => emit('push', { entry: clean(e), existing: true }));
      // GTM reads push, then installs its own push that calls the one it read. Each assignment gets its own
      // pass-through wrapper; only the wrapper currently exposed records, so a chained call through an
      // older wrapper is never recorded twice and can never loop back into itself.
      let exposed = null;
      const wrap = fn => {
        const w = function (...items) {
          if (w === exposed) items.forEach(e => emit('push', { entry: clean(e) }));
          return fn.apply(this, items);
        };
        return w;
      };
      exposed = wrap(arr.push);
      Object.defineProperty(arr, 'push', { configurable: true, get: () => exposed, set: fn => { exposed = wrap(fn); } });
    } catch { /* frozen array */ }
  };

  let current = window.dataLayer;
  hookArray(current);
  try {
    Object.defineProperty(window, 'dataLayer', {
      configurable: true,
      get: () => current,
      set: value => {
        if (current && value !== current) emit('reassigned', { afterGtm: !!window.google_tag_manager, previousLength: current.length });
        current = value;
        hookArray(value);
      },
    });
  } catch { /* page already defined a non-configurable dataLayer */ }
})();
