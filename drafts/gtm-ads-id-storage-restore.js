<script>
(function () {
  // ----------------------------
  // SETTINGS
  // ----------------------------
  var TTL_MS = 24 * 60 * 60 * 1000; // 24h
  var STORAGE_KEY = "ga_ads_ids";

  // Ads identifiers only
  var ID_PARAMS = ["gclid", "gbraid", "wbraid", "msclkid", "fbclid", "li_fat_id"];

  // We also store paid UTMs context when IDs are present
  var UTM_CTX = ["utm_source", "utm_medium", "utm_campaign"];

  // Tag 1 storage key (UTMs)
  var UTM_STORAGE_KEY = "ga_utms";

  // Paid mediums we consider as "ad-like"
  var PAID_MEDIUMS = [
    "cpc","ppc","paidsearch","paid_search","sem",
    "display","banner","programmatic",
    "paid","paid_social","paidsocial","social_paid",
    "retargeting","remarketing","affiliate"
  ];

  // ----------------------------
  // HELPERS
  // ----------------------------
  function now() { return Date.now(); }

  function getSearchParams() {
    return new URLSearchParams(window.location.search || "");
  }

  function norm(v) {
    return (v || "").toString().trim().toLowerCase();
  }

  function extractParams(sp, keys) {
    var out = {};
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var v = sp.get(k);
      if (v) out[k] = v;
    }
    return out;
  }

  function hasAny(obj) {
    for (var k in obj) return true;
    return false;
  }

  function loadJson(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveStored(payload) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {}
  }

  function clearStored() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  function isExpiredByTs(ts) {
    return !ts || (now() - ts) > TTL_MS;
  }

  function hostOf(url) {
    try {
      return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    } catch (e) {
      return "";
    }
  }

  function isDirectOrSelfReferral() {
    var ref = document.referrer || "";
    if (!ref) return true;

    var refHost = hostOf(ref);
    var myHost = window.location.hostname.toLowerCase().replace(/^www\./, "");
    return refHost && refHost === myHost;
  }

  function isPaidMedium(m) {
    m = norm(m);
    for (var i = 0; i < PAID_MEDIUMS.length; i++) {
      if (m === PAID_MEDIUMS[i]) return true;
    }
    return false;
  }

  function ctxMatches(storedCtx, currentCtx) {
    if (!storedCtx || !currentCtx) return false;

    var sc = norm(storedCtx.utm_campaign);
    var cc = norm(currentCtx.utm_campaign);

    var ss = norm(storedCtx.utm_source);
    var cs = norm(currentCtx.utm_source);

    var sm = norm(storedCtx.utm_medium);
    var cm = norm(currentCtx.utm_medium);

    // Need at least a campaign match
    if (!sc || !cc || sc !== cc) return false;

    // If both have source -> must match
    if (ss && cs && ss !== cs) return false;

    // If both have medium -> must match
    if (sm && cm && sm !== cm) return false;

    return true;
  }

  function injectIntoUrl(params) {
    if (!hasAny(params)) return;

    var url = new URL(window.location.href);
    var sp = url.searchParams;
    var changed = false;

    for (var k in params) {
      if (!sp.has(k)) {
        sp.set(k, params[k]);
        changed = true;
      }
    }

    if (changed) {
      history.replaceState({}, "", url.toString());
    }
  }

  function utmsPresentInUrl() {
    var sp = getSearchParams();
    return !!(sp.get("utm_source") || sp.get("utm_medium") || sp.get("utm_campaign"));
  }

  function validUtmStorageExists() {
    var storedUtms = loadJson(UTM_STORAGE_KEY);
    if (!storedUtms || !storedUtms.params || !storedUtms.ts) return false;
    if (isExpiredByTs(storedUtms.ts)) return false;
    return hasAny(storedUtms.params);
  }

  function allowedToRestoreIdsBecauseUtmContextExists() {
    return utmsPresentInUrl() || validUtmStorageExists();
  }

  // ----------------------------
  // MAIN FLOW
  // ----------------------------
  var sp = getSearchParams();

  var freshIds = extractParams(sp, ID_PARAMS);
  var utmCtx = extractParams(sp, UTM_CTX);

  // 1) If URL has fresh IDs -> store them (+ context if present)
  if (hasAny(freshIds)) {
    saveStored({
      ts: now(),
      ids: freshIds,
      ctx: {
        utm_source: utmCtx.utm_source || "",
        utm_medium: utmCtx.utm_medium || "",
        utm_campaign: utmCtx.utm_campaign || ""
      }
    });
    return;
  }

  // 2) No IDs in URL -> maybe restore
  var stored = loadJson(STORAGE_KEY);
  if (!stored || !stored.ids || !stored.ts || isExpiredByTs(stored.ts)) {
    clearStored();
    return;
  }

  // Never inject IDs without UTM context
  if (!allowedToRestoreIdsBecauseUtmContextExists()) {
    return;
  }

  // 2a) Direct/self-referral: restore IDs
  if (isDirectOrSelfReferral()) {
    injectIntoUrl(stored.ids);
    return;
  }

  // 2b) External referrer: only restore if paid UTMs match stored context
  if (hasAny(utmCtx) && isPaidMedium(utmCtx.utm_medium)) {
    if (ctxMatches(stored.ctx, utmCtx)) {
      injectIntoUrl(stored.ids);
    }
  }
})();
</script>
