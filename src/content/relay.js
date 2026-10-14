// ISOLATED world: forwards dataLayer events from dl-hook.js to the service worker.
window.addEventListener('message', e => {
  if (e.source !== window || !e.data || e.data.__tqa !== true) return;
  const { type, ts, entry, existing, afterGtm, previousLength } = e.data;
  chrome.runtime.sendMessage({ type: 'dl-event', event: { type, ts, entry, existing, afterGtm, previousLength } }).catch(() => {});
});
