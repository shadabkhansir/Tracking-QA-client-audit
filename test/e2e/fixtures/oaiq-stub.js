// Minimal stand-in for bzrcdn.openai.com/sdk/oaiq.min.js: posts the same body shape as SDK v0.1.41
// (docs/research/PLATFORM-SPECS.md §1.2) to bzr.openai.com/v1/sdk/events with sendBeacon.
(function () {
  const pid = 'px_e2e_1';
  const oppref = new URLSearchParams(location.search).get('oppref');
  if (oppref) document.cookie = `__oppref=${oppref}; path=/; max-age=2592000`;
  window.oaiq = function (cmd, name, data) {
    if (cmd !== 'measure') return;
    const body = { obref: 'ob_e2e', oppref, events: [{ type: name, id: `e-${Date.now()}`, timestamp_ms: Date.now(), source_url: location.href, data }] };
    navigator.sendBeacon(`https://bzr.openai.com/v1/sdk/events?pid=${pid}&st=oaiq-web&sv=0.1.41&t=${Date.now()}&ec=1`, JSON.stringify(body));
  };
})();
