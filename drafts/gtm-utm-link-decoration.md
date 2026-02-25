# cHTML - UTM link decoration (always)

Décore les liens internes ayming.fr au clic pour propager UTMs et Ads IDs entre les pages.

```html
<script>
(function () {
  var PARAMS = [
    'utm_source','utm_medium','utm_campaign','utm_term','utm_content',
    'gclid','gbraid','wbraid','msclkid','fbclid','li_fat_id'
  ];

  var DOMAINS_TO_DECORATE = ['ayming.fr'];

  function getParam(name) {
    try { return new URLSearchParams(window.location.search).get(name); }
    catch (e) { return null; }
  }

  function shouldDecorateHref(href) {
    if (!href) return false;
    if (href.indexOf('#') > -1) return false;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;

    for (var i = 0; i < DOMAINS_TO_DECORATE.length; i++) {
      if (href.indexOf(DOMAINS_TO_DECORATE[i]) > -1) return true;
    }
    return false;
  }

  function decorate(href) {
    var url;
    try { url = new URL(href, window.location.href); }
    catch (e) { return href; }

    for (var i = 0; i < PARAMS.length; i++) {
      var k = PARAMS[i];
      var v = getParam(k);
      if (v && !url.searchParams.has(k)) url.searchParams.set(k, v);
    }
    return url.toString();
  }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;

    var href = a.getAttribute('href') || '';
    if (!shouldDecorateHref(href)) return;

    var newHref = decorate(a.href);
    if (newHref && newHref !== a.href) a.href = newHref;
  }, true);
})();
</script>
```
