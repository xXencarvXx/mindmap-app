<script>
(function () {
  // ==========================================
  // GF Fallback ultra simple (fields 90/91)
  // - Only fills if empty
  // - URL -> fields
  // - If still empty -> direct/none
  // - Retries until BOTH fields filled
  // - Skips internal traffic (ga_internal=1 or WP admin bar)
  // ==========================================

  // ---- Internal skip ----
  try {
    if (localStorage.getItem('ga_internal') === '1') return;
  } catch (e) {}
  if (document.getElementById('wpadminbar')) return;

  // GF hidden field IDs (same across forms)
  var SOURCE_SEL = 'input[id^="input_"][id$="_90"]';
  var MEDIUM_SEL = 'input[id^="input_"][id$="_91"]';

  function getParam(name) {
    try { return new URLSearchParams(window.location.search).get(name) || ''; }
    catch (e) { return ''; }
  }

  function setIfEmpty(el, value) {
    value = (value || '').toString().trim();
    if (!el || el.value || !value) return false;

    el.value = value;

    // Some plugins listen to input/change events
    try {
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (e) {}

    return true;
  }

  function runOnce() {
    var s = document.querySelector(SOURCE_SEL);
    var m = document.querySelector(MEDIUM_SEL);
    if (!s || !m) return false;

    var sourceNow = (s.value || '').trim();
    var mediumNow = (m.value || '').trim();

    // stop only when BOTH are filled
    if (sourceNow && mediumNow) return true;

    // 1) URL -> fields
    var urlSource = getParam('utm_source');
    var urlMedium = getParam('utm_medium');

    if (!sourceNow && urlSource) setIfEmpty(s, urlSource);
    if (!mediumNow && urlMedium) setIfEmpty(m, urlMedium);

    // refresh
    sourceNow = (s.value || '').trim();
    mediumNow = (m.value || '').trim();

    // 2) If still missing -> direct/none
    if (!sourceNow) setIfEmpty(s, 'direct');
    if (!mediumNow) setIfEmpty(m, 'none');

    // final
    sourceNow = (s.value || '').trim();
    mediumNow = (m.value || '').trim();
    return !!(sourceNow && mediumNow);
  }

  // Wait for late-rendered forms (GF can be delayed)
  var tries = 0;
  var maxTries = 120; // 120 * 250ms = 30s
  var timer = setInterval(function () {
    tries++;
    if (runOnce() || tries >= maxTries) clearInterval(timer);
  }, 250);
})();
</script>
