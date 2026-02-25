<script>
(function () {
  // =========================
  // SETTINGS
  // =========================
  var TTL_MS = 24 * 60 * 60 * 1000; // 24h

  var UTM_PARAMS = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'];
  var UTM_STORAGE_KEY = 'ga_utms';

  var KEY_FIRST_REF = 'ga_first_ref';
  var KEY_FIRST_REF_TS = 'ga_first_ref_ts';

  // LLM utm_source values we normalize to medium=llm if medium missing
  var LLM_SOURCES = [
    'chatgpt','openai','perplexity','mistral','gemini','copilot',
    'claude','anthropic','poe','youchat','you.com','phind',
    'deepseek','meta','le-chat'
  ];

  // Search engines markers (includes Brave)
  var SEARCH_HOST_MARKERS = [
    'google.',
    'bing.com',
    'duckduckgo.com',
    'search.yahoo.',
    'yahoo.',
    'qwant.com',
    'search.brave.com',
    'brave.com'
  ];

  // LLM hosts (when no UTMs exist)
  var LLM_HOSTS = [
    'chatgpt.com',
    'perplexity.ai',
    'chat.mistral.ai',
    'le-chat.mistral.ai',
    'gemini.google.com',
    'copilot.microsoft.com',
    'copilot.com',
    'claude.ai',
    'poe.com',
    'you.com',
    'phind.com',
    'deepseek.com',
    'meta.ai'
  ];

  // Optional internal skip
  var KEY_INTERNAL = 'ga_internal';

  // =========================
  // HELPERS
  // =========================
  function now() { return Date.now(); }

  function isExpired(ts) { return !ts || (now() - ts) > TTL_MS; }

  function getSearchParams() { return new URLSearchParams(window.location.search || ''); }

  function norm(v) { return (v || '').toString().trim().toLowerCase(); }

  function extractParams(sp, keys) {
    var out = {};
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var v = sp.get(k);
      if (v) out[k] = v;
    }
    return out;
  }

  function hasAny(obj) { for (var k in obj) return true; return false; }

  function loadStored(key) {
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
    catch (e) { return null; }
  }

  function saveStored(key, params) {
    try { localStorage.setItem(key, JSON.stringify({ ts: now(), params: params })); }
    catch (e) {}
  }

  function clearStored(key) { try { localStorage.removeItem(key); } catch (e) {} }

  function storedExpired(stored) { return !stored || !stored.ts || (now() - stored.ts) > TTL_MS; }

  function injectIntoUrl(params) {
    if (!hasAny(params)) return;

    var url = new URL(window.location.href);
    var sp2 = url.searchParams;
    var changed = false;

    for (var k in params) {
      if (!sp2.has(k)) {
        sp2.set(k, params[k]);
        changed = true;
      }
    }

    if (changed) history.replaceState({}, '', url.toString());
  }

  function overwriteUrlParams(params) {
    var url = new URL(window.location.href);
    var sp2 = url.searchParams;
    var changed = false;

    for (var k in params) {
      if (params[k] && sp2.get(k) !== params[k]) {
        sp2.set(k, params[k]);
        changed = true;
      }
    }

    if (changed) history.replaceState({}, '', url.toString());
    return url;
  }

  function hostFromUrl(input) {
    try {
      var v = (input || '').toString().trim();
      if (!v) return '';
      if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
      return new URL(v).hostname.toLowerCase().replace(/^www\./, '');
    } catch (e) {
      return '';
    }
  }

  function sameDomainRef(ref) {
    try {
      var refHost = hostFromUrl(ref);
      var myHost = window.location.hostname.replace(/^www\./, '').toLowerCase();
      return refHost && refHost === myHost;
    } catch (e) { return false; }
  }

  function isLlmSource(src) {
    src = norm(src);
    if (!src) return false;
    for (var i = 0; i < LLM_SOURCES.length; i++) {
      var s = norm(LLM_SOURCES[i]);
      if (!s) continue;
      if (src === s) return true;
      if (src.indexOf(s) > -1) return true;
    }
    return false;
  }

  function isSearchHost(host) {
    host = norm(host);
    for (var i = 0; i < SEARCH_HOST_MARKERS.length; i++) {
      if (host.indexOf(SEARCH_HOST_MARKERS[i]) > -1) return true;
    }
    return false;
  }

  function isLlmHost(host) {
    host = norm(host);
    for (var i = 0; i < LLM_HOSTS.length; i++) {
      if (host.indexOf(LLM_HOSTS[i]) > -1) return true;
    }
    return false;
  }

  function llmLabelFromHost(host) {
    host = norm(host);
    if (host.indexOf('chatgpt.com') > -1) return 'chatgpt';
    if (host.indexOf('perplexity.ai') > -1) return 'perplexity';
    if (host.indexOf('le-chat.mistral.ai') > -1) return 'mistral';
    if (host.indexOf('chat.mistral.ai') > -1) return 'mistral';
    if (host.indexOf('gemini.google.com') > -1) return 'gemini';
    if (host.indexOf('copilot.') > -1 || host.indexOf('copilot.com') > -1) return 'copilot';
    if (host.indexOf('claude.ai') > -1) return 'claude';
    if (host.indexOf('poe.com') > -1) return 'poe';
    if (host.indexOf('you.com') > -1) return 'you.com';
    if (host.indexOf('phind.com') > -1) return 'phind';
    if (host.indexOf('deepseek.com') > -1) return 'deepseek';
    if (host.indexOf('meta.ai') > -1) return 'meta';
    return host;
  }

  function shouldSkipInternal() {
    try { if (localStorage.getItem(KEY_INTERNAL) === '1') return true; }
    catch (e) {}
    if (document.getElementById('wpadminbar')) return true;
    return false;
  }

  function searchSourceFromHost(host) {
    host = norm(host);

    if (host.indexOf('search.brave.com') > -1 || host.indexOf('brave.com') > -1) return 'brave';
    if (host.indexOf('qwant.com') > -1) return 'qwant';
    if (host.indexOf('bing.com') > -1) return 'bing';
    if (host.indexOf('duckduckgo.com') > -1) return 'duckduckgo';
    if (host.indexOf('yahoo') > -1) return 'yahoo';
    if (host.indexOf('google.') > -1) return 'google';

    return host;
  }

  // =========================
  // PART 0: Optional internal skip
  // =========================
  if (shouldSkipInternal()) return;

  // =========================
  // PART 1: Capture first external referrer (24h)
  // =========================
  try {
    var existingRef = (localStorage.getItem(KEY_FIRST_REF) || '').trim();
    var existingTs = parseInt(localStorage.getItem(KEY_FIRST_REF_TS), 10);

    if (!existingRef || isExpired(existingTs)) {
      var ref = (document.referrer || '').trim();

      if (ref && !sameDomainRef(ref)) {
        localStorage.setItem(KEY_FIRST_REF, ref);
        localStorage.setItem(KEY_FIRST_REF_TS, String(now()));
      } else {
        if (!existingTs || isNaN(existingTs)) {
          localStorage.setItem(KEY_FIRST_REF_TS, String(now()));
        }
      }
    }
  } catch (e) {}

  // =========================
  // PART 2: UTM storage + restore (24h) + bootstrap
  // =========================
  var sp = getSearchParams();

  // PATCH A: if utm_source looks like LLM and utm_medium missing -> set utm_medium=llm
  (function ensureLlmMediumInUrl() {
    try {
      var src = sp.get('utm_source') || '';
      var med = sp.get('utm_medium') || '';
      if (src && !med && isLlmSource(src)) {
        var url = new URL(window.location.href);
        url.searchParams.set('utm_medium', 'llm');
        history.replaceState({}, '', url.toString());
        sp = url.searchParams;
      }
    } catch (e) {}
  })();

  var freshUtms = extractParams(sp, UTM_PARAMS);

  // Case 1: URL contains UTMs -> overwrite storage (latest wins)
  if (hasAny(freshUtms)) {
    saveStored(UTM_STORAGE_KEY, freshUtms);
    return;
  }

  // Case 2: No UTMs in URL -> restore from storage if valid
  var storedUtms = loadStored(UTM_STORAGE_KEY);
  if (storedUtms && storedUtms.params && !storedExpired(storedUtms)) {
    var p = storedUtms.params || {};
    if (p.utm_source && p.utm_medium) {
      injectIntoUrl(p);
      return;
    }
  }

  // storage missing, stale, or incomplete -> clear and bootstrap
  clearStored(UTM_STORAGE_KEY);

  // Case 3: No UTMs anywhere -> bootstrap from first referrer
  (function bootstrapFromFirstRef() {
    try {
      var firstRef = '';
      try { firstRef = (localStorage.getItem(KEY_FIRST_REF) || '').trim(); } catch (e) {}
      if (!firstRef) firstRef = (document.referrer || '').trim();

      var host = hostFromUrl(firstRef);

      if (!host) return;
      var myHost = window.location.hostname.toLowerCase().replace(/^www\./, '');
      if (host === myHost) return;

      // LLM detection BEFORE search detection (Gemini contains "google.")
      if (isLlmHost(host)) {
        var label = llmLabelFromHost(host);
        overwriteUrlParams({ utm_source: label, utm_medium: 'llm' });
        saveStored(UTM_STORAGE_KEY, { utm_source: label, utm_medium: 'llm' });
        return;
      }

      // Search engines -> organic
      if (isSearchHost(host)) {
        var src = searchSourceFromHost(host);
        overwriteUrlParams({ utm_source: src, utm_medium: 'organic' });
        saveStored(UTM_STORAGE_KEY, { utm_source: src, utm_medium: 'organic' });
        return;
      }

      // Generic referral
      overwriteUrlParams({ utm_source: host, utm_medium: 'referral' });
      saveStored(UTM_STORAGE_KEY, { utm_source: host, utm_medium: 'referral' });
    } catch (e) {}
  })();

})();
</script>
