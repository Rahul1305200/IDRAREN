/**
 * Idraren site helpers — wishlist + newsletter (shared storage keys).
 * Load after support.js on any page that needs them.
 */
(function (global) {
  'use strict';

  var WL_KEY = 'idraren-wishlist';
  var WL_HASH = 'idraren-wl';
  // v2 clears accidental dismisses from earlier builds
  var NL_KEY = 'idraren-nl-v2';
  var NL_SESSION = 'idraren-nl-session-v2';
  var NL_COOLDOWN_MS = 21 * 24 * 60 * 60 * 1000;

  // Client rug pack (Rabab) — numbers are the product names.
  // Main = new-1; B/C/D = gallery (+ Home hover uses B).
  function rugPaths(num, shots) {
    var base = './images/rugs/rug-' + num;
    // Main product = cutout PNG (no studio white). B/C/D stay lifestyle JPGs.
    var gallery = [base + '.png'];
    var i;
    for (i = 0; i < shots.length; i++) gallery.push(base + '-' + shots[i] + '.jpg');
    return {
      image: base + '.png',
      hoverImage: base + '-b.jpg',
      gallery: gallery,
    };
  }

  function makeRug(spec) {
    var paths = rugPaths(spec.num, spec.shots || ['b', 'c', 'd']);
    var name = 'Rug ' + spec.num;
    var region = spec.region;
    var sizeFt = '5 × 8 ft';
    var note = region + ' · enquire for size';
    return {
      id: 'rug-' + spec.num,
      num: spec.num,
      name: name,
      image: paths.image,
      hoverImage: paths.hoverImage,
      gallery: paths.gallery,
      collection: spec.collection,
      region: region,
      origin: { en: region, fr: region },
      style: { en: 'Handwoven', fr: 'Tissé main' },
      // PDP uses display size; Shop filters use sizeKey.
      size: sizeFt,
      sizeKey: spec.sizeKey || '5x8',
      sizes: [sizeFt, '6 × 9 ft', '8 × 10 ft', 'Custom'],
      price: spec.price || 'from $2, 480',
      priceNum: spec.priceNum || 2480,
      colour: spec.colour || 'multicolour',
      fibre: { en: 'Handwoven wool', fr: 'Laine tissée main' },
      fibreKey: spec.fibreKey || 'knots',
      material: spec.material || 'wool',
      avail: { en: 'One of a kind', fr: 'Pièce unique' },
      body: {
        en: 'Handwoven in Morocco for the ' + region + ' collection. One of a kind; enquire to reserve.',
        fr: 'Tissé main au Maroc pour la collection ' + region + '. Pièce unique ; demandez pour réserver.',
      },
      note: note,
      line: 'Handwoven wool · one of a kind',
      tags: (name + ' ' + region + ' ' + spec.collection + ' ' + (spec.cats || '')).toLowerCase(),
      cats: spec.cats || 'all collections',
    };
  }

  // New Arrivals (Home shelf): Main-page rugs 45 / 52 / 76.
  // Shop collections: only what sits in "rug images for * collection"
  // (45 is Main-page Anfa only — not in the Anfa shop folder).
  var RUG_CATALOG = [
    makeRug({ num: 45, collection: '', region: 'Anfa', price: 'from $2, 640', priceNum: 2640, cats: 'all new' }),
    makeRug({ num: 52, collection: 'atlas', region: 'Atlas', price: 'from $3, 150', priceNum: 3150, cats: 'all new bestsellers collections' }),
    makeRug({ num: 76, collection: 'rabat', region: 'Rabat', price: 'from $2, 880', priceNum: 2880, cats: 'all new collections' }),
    makeRug({ num: 43, collection: 'atlas', region: 'Atlas', price: 'from $2, 480', priceNum: 2480, cats: 'all bestsellers collections' }),
    makeRug({ num: 48, collection: 'atlas', region: 'Atlas', price: 'from $2, 720', priceNum: 2720, cats: 'all collections instock' }),
    makeRug({ num: 51, collection: 'atlas', region: 'Atlas', price: 'from $2, 960', priceNum: 2960, cats: 'all collections' }),
    makeRug({ num: 54, collection: 'atlas', region: 'Atlas', price: 'from $2, 180', priceNum: 2180, cats: 'all collections instock' }),
    makeRug({ num: 57, collection: 'atlas', region: 'Atlas', price: 'from $3, 480', priceNum: 3480, shots: ['b', 'd'], cats: 'all collections' }),
    makeRug({ num: 62, collection: 'atlas', region: 'Atlas', price: 'from $2, 540', priceNum: 2540, shots: ['b', 'c'], cats: 'all collections' }),
    makeRug({ num: 63, collection: 'anfa', region: 'Anfa', price: 'from $2, 320', priceNum: 2320, cats: 'all collections customized' }),
    makeRug({ num: 67, collection: 'rabat', region: 'Rabat', price: 'from $3, 050', priceNum: 3050, cats: 'all bestsellers collections' }),
    makeRug({ num: 68, collection: 'rabat', region: 'Rabat', price: 'from $2, 690', priceNum: 2690, cats: 'all collections instock' }),
    makeRug({ num: 77, collection: 'anfa', region: 'Anfa', price: 'from $2, 850', priceNum: 2850, cats: 'all collections customized' }),
  ];

  function getRugCatalog() {
    return RUG_CATALOG.slice();
  }

  function getRugById(id) {
    var i;
    for (i = 0; i < RUG_CATALOG.length; i++) {
      if (RUG_CATALOG[i].id === id) return RUG_CATALOG[i];
    }
    return RUG_CATALOG[0] || null;
  }

  function readWishlist() {
    try {
      var raw = localStorage.getItem(WL_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function writeWishlist(list) {
    // Storage can throw, not just return empty: private windows, disabled
    // site data, and quota all raise here. readWishlist already guards; this
    // did not, so a failed write took the Save button down with it. The list
    // still updates in the page for this visit, it just will not persist.
    try {
      localStorage.setItem(WL_KEY, JSON.stringify(list));
    } catch (e) {}
    try {
      global.dispatchEvent(new CustomEvent('idraren:wishlist', { detail: { count: list.length } }));
    } catch (e) {}
  }

  // file:// gives each HTML file its own localStorage origin. Saving on
  // Product.dc.html never reaches Saved.dc.html unless we carry the list
  // through the navigation URL. Harmless on http(s) where storage is shared.
  function wishlistTransferHref(list) {
    list = list || readWishlist();
    var base = './Saved.dc.html';
    if (!list.length) return base;
    try {
      return base + '#' + WL_HASH + '=' + encodeURIComponent(JSON.stringify(list));
    } catch (e) {
      return base;
    }
  }

  function ingestWishlistTransfer() {
    try {
      var hash = String(global.location && global.location.hash || '');
      var prefix = '#' + WL_HASH + '=';
      if (hash.indexOf(prefix) !== 0) return false;
      var list = JSON.parse(decodeURIComponent(hash.slice(prefix.length)));
      if (!Array.isArray(list)) return false;
      var clean = [];
      for (var i = 0; i < list.length; i++) {
        var p = list[i];
        if (!p || !p.id) continue;
        clean.push({
          id: String(p.id),
          name: p.name || '',
          price: p.price || '',
          image: p.image || '',
          note: p.note || '',
        });
      }
      writeWishlist(clean);
      try {
        if (global.history && global.history.replaceState) {
          global.history.replaceState(null, '', global.location.pathname + global.location.search);
        } else {
          global.location.hash = '';
        }
      } catch (e2) {}
      return true;
    } catch (e) {
      return false;
    }
  }

  ingestWishlistTransfer();

  var Wishlist = {
    key: WL_KEY,
    all: readWishlist,
    count: function () { return readWishlist().length; },
    has: function (id) {
      return readWishlist().some(function (p) { return p.id === id; });
    },
    add: function (item) {
      if (!item || !item.id) return readWishlist();
      var list = readWishlist().filter(function (p) { return p.id !== item.id; });
      list.unshift({
        id: item.id,
        name: item.name || '',
        price: item.price || '',
        image: item.image || '',
        note: item.note || '',
      });
      writeWishlist(list);
      return list;
    },
    remove: function (id) {
      var list = readWishlist().filter(function (p) { return p.id !== id; });
      writeWishlist(list);
      return list;
    },
    toggle: function (item) {
      if (Wishlist.has(item.id)) return { list: Wishlist.remove(item.id), saved: false };
      return { list: Wishlist.add(item), saved: true };
    },
    names: function () {
      return readWishlist().map(function (p) { return p.name; });
    },
    clear: function () {
      writeWishlist([]);
    },
  };

  function readNl() {
    try {
      var raw = localStorage.getItem(NL_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function forceNewsletterFromUrl() {
    try {
      return new URLSearchParams(global.location.search).get('nl') === '1';
    } catch (e) {
      return false;
    }
  }

  function shouldShowNewsletter() {
    if (forceNewsletterFromUrl()) return true;
    var state = readNl();
    if (state.subscribed) return false;
    try {
      if (sessionStorage.getItem(NL_SESSION) === '1') return false;
    } catch (e) {}
    if (state.dismissedAt && Date.now() - Number(state.dismissedAt) < NL_COOLDOWN_MS) return false;
    return true;
  }

  function resetNewsletter() {
    try { localStorage.removeItem(NL_KEY); } catch (e) {}
    try { sessionStorage.removeItem(NL_SESSION); } catch (e) {}
    // also clear legacy keys from earlier builds
    try { localStorage.removeItem('idraren-nl'); } catch (e) {}
    try { sessionStorage.removeItem('idraren-nl-session'); } catch (e) {}
  }

  /**
   * Mount newsletter popup. Options:
   *   delayMs — wait after schedule() (default 8000)
   *   waitForUnlock — if true, caller must call schedule() after hero unlock
   * Returns { schedule, destroy, openNow }
   */
  function mountNewsletter(opts) {
    opts = opts || {};
    var delayMs = opts.delayMs != null ? opts.delayMs : 8000;
    if (forceNewsletterFromUrl()) delayMs = Math.min(delayMs, 600);

    var root = document.getElementById('nl-popup');
    var form = document.getElementById('nl-form');
    var closeBtn = document.getElementById('nl-close');
    if (!root) {
      return { schedule: function () {}, destroy: function () {}, openNow: function () {} };
    }

    var openT = null;
    var doneT = null;
    var opened = false;

    function open() {
      if (opened) return;
      if (!forceNewsletterFromUrl() && !shouldShowNewsletter()) return;
      opened = true;
      try { sessionStorage.setItem(NL_SESSION, '1'); } catch (e) {}
      root.classList.add('is-open');
      root.setAttribute('aria-hidden', 'false');
    }

    function close(subscribed) {
      root.classList.remove('is-open');
      root.setAttribute('aria-hidden', 'true');
      if (forceNewsletterFromUrl()) return; // don't persist dismiss while testing with ?nl=1
      var state = readNl();
      if (subscribed) state.subscribed = true;
      else state.dismissedAt = Date.now();
      try { localStorage.setItem(NL_KEY, JSON.stringify(state)); } catch (e) {}
    }

    function schedule() {
      clearTimeout(openT);
      if (!forceNewsletterFromUrl() && !shouldShowNewsletter()) return;
      openT = setTimeout(open, delayMs);
    }

    function onCloseClick() { close(false); }
    function onSubmit(e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      root.classList.add('is-done');
      clearTimeout(doneT);
      doneT = setTimeout(function () { close(true); }, 2200);
    }
    function onEsc(e) {
      if (e.key === 'Escape' && root.classList.contains('is-open')) close(false);
    }

    if (closeBtn) closeBtn.addEventListener('click', onCloseClick);
    if (form) form.addEventListener('submit', onSubmit);
    window.addEventListener('keydown', onEsc);

    if (!opts.waitForUnlock) schedule();

    return {
      schedule: schedule,
      openNow: open,
      destroy: function () {
        clearTimeout(openT);
        clearTimeout(doneT);
        if (closeBtn) closeBtn.removeEventListener('click', onCloseClick);
        if (form) form.removeEventListener('submit', onSubmit);
        window.removeEventListener('keydown', onEsc);
      },
    };
  }

  /**
   * Keeps the header "Saved" link in step with the list. Lives here rather
   * than in each page's script block so all 13 pages share one implementation
   * and nothing has to be kept in sync by hand. Does nothing on a page that
   * has no [data-saved-count] element.
   */
  function syncSavedLinks() {
    var n = Wishlist.count();
    var text = n > 0 ? String(n) : '';
    var nodes = document.querySelectorAll('[data-saved-count]');
    // Write only on change: the observer in mountSavedLinks watches the DOM,
    // and an unconditional write would retrigger it forever.
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].textContent !== text) nodes[i].textContent = text;
      if (nodes[i].hidden !== (n === 0)) nodes[i].hidden = n === 0;
    }
    var href = wishlistTransferHref();
    var links = document.querySelectorAll('[data-saved-link]');
    for (var j = 0; j < links.length; j++) {
      if (links[j].classList.contains('is-empty') !== (n === 0)) links[j].classList.toggle('is-empty', n === 0);
      if (links[j].getAttribute('href') !== href) links[j].setAttribute('href', href);
    }
    var popView = document.querySelector('.idr-pop [data-pop-view]');
    if (popView && popView.getAttribute('href') !== href) popView.setAttribute('href', href);
  }

  function mountSavedLinks() {
    syncSavedLinks();
    // support.js builds the page from its template on its own schedule, which
    // on lighter pages lands after window 'load' — the header and menu badges
    // were then created blank and never filled. Re-sync whenever nodes arrive.
    if (global.MutationObserver && document.body) {
      var queued = false;
      new MutationObserver(function () {
        if (queued) return;
        queued = true;
        (global.requestAnimationFrame || setTimeout)(function () { queued = false; syncSavedLinks(); });
      }).observe(document.body, { childList: true, subtree: true });
    }
    global.addEventListener('idraren:wishlist', syncSavedLinks);
    // another tab changed the list
    global.addEventListener('storage', function (e) {
      if (e.key === WL_KEY) syncSavedLinks();
    });
    // Before leaving for Saved, stamp the current list into the href so
    // file:// origins (isolated per HTML file) still deliver the pieces.
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest && e.target.closest('a[href*="Saved.dc.html"]');
      if (!a) return;
      var next = wishlistTransferHref();
      if (a.getAttribute('href') !== next) a.setAttribute('href', next);
    }, true);
  }

  // ── Saved page list ────────────────────────────────────────────────────
  // support.js re-fetches the template after mount and React replaces the DOM,
  // which wiped a one-shot render in Saved.dc.html (empty state forever even
  // with items in localStorage). Re-query nodes every pass and re-paint when
  // the tree is replaced — same survival pattern as mountSavedLinks.
  var CM_BY_FT = {
    '4 × 6 ft': '120 × 180 cm', '5 × 7 ft': '150 × 210 cm',
    '5 × 8 ft': '150 × 240 cm', '6 × 8 ft': '180 × 240 cm',
    '6 × 9 ft': '180 × 270 cm', '8 × 10 ft': '240 × 300 cm',
    '9 × 12 ft': '270 × 360 cm',
  };

  function normaliseSavedNote(note) {
    if (!note || String(note).indexOf('cm') !== -1) return note;
    return String(note).replace(/(\d+ × \d+ ft)/, function (ft) {
      return CM_BY_FT[ft] ? CM_BY_FT[ft] + ' (' + ft + ')' : ft;
    });
  }

  function escSaved(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function renderSavedPage() {
    var listEl = document.getElementById('saved-list');
    var emptyEl = document.getElementById('saved-empty');
    if (!listEl || !emptyEl) return false;

    var actionsEl = document.getElementById('saved-actions');
    var countEl = document.getElementById('saved-title-count');
    var items = Wishlist.all();
    var lang = 'en';
    try {
      if (localStorage.getItem('idraren-lang') === 'fr') lang = 'fr';
    } catch (e) {}
    var removeLabel = lang === 'fr' ? 'Retirer' : 'Remove';
    var unit = items.length === 1
      ? (lang === 'fr' ? 'pièce' : 'piece')
      : (lang === 'fr' ? 'pièces' : 'pieces');
    var has = items.length > 0;

    if (countEl) {
      countEl.textContent = items.length + ' ' + unit;
      countEl.hidden = !has;
    }
    emptyEl.hidden = has;
    listEl.hidden = !has;
    if (actionsEl) actionsEl.hidden = !has;

    var sig = 'overlay1:' + items.length + ':' + items.map(function (p) { return p.id; }).join(',');
    if (listEl.getAttribute('data-idr-saved-sig') !== sig) {
      listEl.setAttribute('data-idr-saved-sig', sig);
      listEl.innerHTML = items.map(function (p) {
        var href = './Product.dc.html?id=' + encodeURIComponent(p.id);
        var note = p.note ? normaliseSavedNote(p.note) : '';
        return '<div class="saved-item">' +
          '<a class="saved-item-tile" href="' + escSaved(href) + '">' +
            '<div class="saved-item-media">' +
              (p.image ? '<img src="' + escSaved(p.image) + '" alt="' + escSaved(p.name) + '" loading="lazy">' : '') +
            '</div>' +
            '<div class="saved-item-copy">' +
              '<h2 class="saved-item-name">' + escSaved(p.name) + '</h2>' +
              '<div class="saved-item-meta">' +
                (note ? '<span class="saved-item-note">' + escSaved(note) + '</span>' : '') +
                (p.price ? '<span class="saved-item-price">' + escSaved(p.price) + '</span>' : '') +
              '</div>' +
            '</div>' +
          '</a>' +
          '<button type="button" class="saved-remove" data-id="' + escSaved(p.id) + '">' + escSaved(removeLabel) + '</button>' +
        '</div>';
      }).join('');
    }
    return true;
  }

  function mountSavedPage() {
    if (global.__idrSavedPageMounted) return;
    global.__idrSavedPageMounted = true;

    ingestWishlistTransfer();

    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var removeBtn = t.closest('.saved-remove');
      if (removeBtn) {
        e.preventDefault();
        Wishlist.remove(removeBtn.getAttribute('data-id'));
        renderSavedPage();
        return;
      }
      if (t.closest('#saved-clear')) {
        e.preventDefault();
        Wishlist.clear();
        renderSavedPage();
      }
    });

    global.addEventListener('idraren:wishlist', renderSavedPage);
    global.addEventListener('storage', function (e) {
      if (e.key === WL_KEY) renderSavedPage();
    });
    global.addEventListener('idraren:lang', renderSavedPage);
    global.addEventListener('load', function () {
      ingestWishlistTransfer();
      renderSavedPage();
    });

    if (global.MutationObserver && document.body) {
      var queued = false;
      new MutationObserver(function () {
        if (!document.getElementById('saved-list')) return;
        if (queued) return;
        queued = true;
        (global.requestAnimationFrame || setTimeout)(function () {
          queued = false;
          ingestWishlistTransfer();
          renderSavedPage();
        });
      }).observe(document.body, { childList: true, subtree: true });
    }

    renderSavedPage();
    setTimeout(function () { ingestWishlistTransfer(); renderSavedPage(); }, 0);
    setTimeout(function () { ingestWishlistTransfer(); renderSavedPage(); }, 150);
    setTimeout(function () { ingestWishlistTransfer(); renderSavedPage(); }, 500);
  }

  /**
   * "Saved" confirmation card. Drops in under the header's bookmark icon (so
   * the reader sees where the piece went), shows the rug, and offers the two
   * next steps. Styles are injected once, so every page gets it for free.
   *   savedPopup({ saved: true, name, note, image, lang: 'en' | 'fr' })
   * Auto-closes after 5s; hovering or focusing it holds it open. Escape, the
   * close button, "Continue browsing" or a click elsewhere dismiss it.
   */
  var popEl = null;
  var popT = null;
  var BOOKMARK = 'M6.5 3.75h11a1 1 0 0 1 1 1v15.1a.4.4 0 0 1-.62.33L12 16.4l-5.88 3.78a.4.4 0 0 1-.62-.33V4.75a1 1 0 0 1 1-1Z';

  function injectPopupCss() {
    if (document.getElementById('idr-pop-css')) return;
    var css = document.createElement('style');
    css.id = 'idr-pop-css';
    css.textContent = [
      '.idr-pop{position:fixed;z-index:9999;width:340px;max-width:calc(100vw - 32px);background:#EDE6DE;color:#252522;',
      'border:1px solid rgba(37,37,34,.1);box-shadow:0 24px 60px -18px rgba(31,30,22,.35);',
      'font-family:Manrope,"Helvetica Neue",Arial,sans-serif;opacity:0;visibility:hidden;transform:translateY(-8px);',
      'transition:opacity .28s ease,transform .38s cubic-bezier(.22,1,.36,1),visibility 0s linear .38s}',
      '.idr-pop.is-on{opacity:1;visibility:visible;transform:none;transition:opacity .28s ease,transform .38s cubic-bezier(.22,1,.36,1),visibility 0s}',
      '.idr-pop::before{content:"";position:absolute;top:-6px;right:var(--caret-r,22px);width:10px;height:10px;background:#EDE6DE;',
      'border-left:1px solid rgba(37,37,34,.1);border-top:1px solid rgba(37,37,34,.1);transform:rotate(45deg)}',
      '.idr-pop-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px 12px 18px;border-bottom:1px solid rgba(37,37,34,.08)}',
      '.idr-pop-status{display:flex;align-items:center;gap:9px;font-size:10px;font-weight:600;letter-spacing:.24em;text-transform:uppercase}',
      '.idr-pop-status svg{width:14px;height:14px;flex:0 0 auto}',
      '.idr-pop-close{appearance:none;border:0;background:none;padding:4px;margin:-4px;cursor:pointer;color:inherit;opacity:.55;line-height:0}',
      '.idr-pop-close:hover{opacity:1}',
      '.idr-pop-close svg{width:14px;height:14px}',
      '.idr-pop-body{display:grid;grid-template-columns:64px 1fr;gap:16px;align-items:center;padding:16px 18px}',
      '.idr-pop-img{width:64px;height:80px;object-fit:cover;background:#E8D8C8;display:block}',
      '.idr-pop-name{font-family:"Cormorant Garamond",Georgia,serif;font-size:21px;font-weight:600;line-height:1.1;margin:0 0 6px}',
      '.idr-pop-note{font-size:12px;line-height:1.45;color:rgba(37,37,34,.62);margin:0}',
      '.idr-pop-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 18px 18px}',
      '.idr-pop-actions a,.idr-pop-actions button{display:flex;align-items:center;justify-content:center;height:42px;padding:0 10px;',
      'font:inherit;font-size:10px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;text-decoration:none;cursor:pointer;',
      'border:1px solid #252522;transition:background .25s ease,color .25s ease;white-space:nowrap}',
      '.idr-pop-primary{background:#252522;color:#EDE6DE}',
      '.idr-pop-primary:hover{background:#3a3934;opacity:1}',
      '.idr-pop-secondary{background:transparent;color:#252522}',
      '.idr-pop-secondary:hover{background:rgba(37,37,34,.06)}',
      '.idr-pop.is-removed .idr-pop-body{opacity:.6}',
      '@keyframes idrBump{0%{transform:scale(1)}35%{transform:scale(1.28)}70%{transform:scale(.94)}100%{transform:scale(1)}}',
      '[data-saved-link].is-bump .saved-icon{animation:idrBump .55s cubic-bezier(.22,1,.36,1)}',
      '@media (max-width:640px){.idr-pop{left:16px!important;right:16px!important;top:auto!important;bottom:16px;width:auto;transform:translateY(12px)}',
      '.idr-pop::before{display:none}}',
      '@media (prefers-reduced-motion:reduce){.idr-pop,.idr-pop.is-on{transition:opacity .2s ease,visibility 0s;transform:none}',
      '[data-saved-link].is-bump .saved-icon{animation:none}}'
    ].join('');
    document.head.appendChild(css);
  }

  function visibleSavedLink() {
    var links = document.querySelectorAll('[data-saved-link]');
    for (var i = 0; i < links.length; i++) {
      var r = links[i].getBoundingClientRect();
      if (r.width && r.height && r.bottom > 0 && r.top < global.innerHeight) return links[i];
    }
    return null;
  }

  function closePopup() {
    if (!popEl) return;
    clearTimeout(popT);
    popEl.classList.remove('is-on');
  }

  function savedPopup(opts) {
    opts = opts || {};
    injectPopupCss();
    var fr = opts.lang === 'fr';
    var saved = opts.saved !== false;
    var t = fr
      ? { on: 'Enregistré', off: 'Retiré', view: 'Voir la liste', cont: 'Continuer', close: 'Fermer' }
      : { on: 'Saved to your list', off: 'Removed from your list', view: 'View saved', cont: 'Keep browsing', close: 'Close' };
    var n = Wishlist.count();

    if (!popEl) {
      popEl = document.createElement('div');
      popEl.className = 'idr-pop';
      popEl.setAttribute('role', 'status');
      popEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(popEl);
      popEl.addEventListener('mouseenter', function () { clearTimeout(popT); });
      popEl.addEventListener('focusin', function () { clearTimeout(popT); });
      popEl.addEventListener('mouseleave', function () { popT = setTimeout(closePopup, 2500); });
      popEl.addEventListener('click', function (e) {
        if (e.target.closest('[data-pop-close]')) closePopup();
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePopup(); });
      document.addEventListener('pointerdown', function (e) {
        if (popEl.classList.contains('is-on') && !popEl.contains(e.target) && !e.target.closest('#pdp-wish')) closePopup();
      });
    }

    popEl.classList.toggle('is-removed', !saved);
    popEl.innerHTML =
      '<div class="idr-pop-head">' +
        '<span class="idr-pop-status"><svg viewBox="0 0 24 24" fill="' + (saved ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="' + BOOKMARK + '"/></svg><span data-pop-status></span></span>' +
        '<button type="button" class="idr-pop-close" data-pop-close aria-label="' + t.close + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '</div>' +
      '<div class="idr-pop-body">' +
        (opts.image ? '<img class="idr-pop-img" alt="" data-pop-img>' : '<span></span>') +
        '<div><p class="idr-pop-name" data-pop-name></p><p class="idr-pop-note" data-pop-note></p></div>' +
      '</div>' +
      '<div class="idr-pop-actions">' +
        '<a class="idr-pop-primary" href="./Saved.dc.html" data-pop-view></a>' +
        '<button type="button" class="idr-pop-secondary" data-pop-close></button>' +
      '</div>';
    popEl.querySelector('[data-pop-status]').textContent = saved ? t.on : t.off;
    popEl.querySelector('[data-pop-name]').textContent = opts.name || '';
    popEl.querySelector('[data-pop-note]').textContent = opts.note || '';
    popEl.querySelector('[data-pop-view]').textContent = t.view + (n ? ' (' + n + ')' : '');
    popEl.querySelector('[data-pop-view]').setAttribute('href', wishlistTransferHref());
    popEl.querySelector('.idr-pop-secondary').textContent = t.cont;
    if (opts.image) popEl.querySelector('[data-pop-img]').src = opts.image;

    // Anchor under the header bookmark when it is on screen; else top-right.
    var link = visibleSavedLink();
    var W = Math.min(340, global.innerWidth - 32);
    if (link) {
      var r = link.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var left = Math.max(16, Math.min(cx - W + 27, global.innerWidth - W - 16));
      popEl.style.top = Math.round(r.bottom + 14) + 'px';
      popEl.style.left = Math.round(left) + 'px';
      popEl.style.right = 'auto';
      popEl.style.setProperty('--caret-r', Math.round(left + W - cx - 5) + 'px');
      link.classList.remove('is-bump');
      void link.offsetWidth;
      link.classList.add('is-bump');
    } else {
      popEl.style.top = '24px';
      popEl.style.right = '24px';
      popEl.style.left = 'auto';
      popEl.style.setProperty('--caret-r', '-100px');
    }

    popEl.classList.remove('is-on');
    void popEl.offsetWidth;
    popEl.classList.add('is-on');
    clearTimeout(popT);
    popT = setTimeout(closePopup, opts.duration || 5000);
  }

  /**
   * Phone menu extras (Enquiry, Info links, Search, Saved) — the desktop
   * header options that the ≤640px menu used to drop. Markup lives in each
   * page's .mm-panel; the styling and the Search hand-off live here once.
   */
  function injectMenuCss() {
    if (document.getElementById('idr-mm-css')) return;
    var css = document.createElement('style');
    css.id = 'idr-mm-css';
    // Burger chrome turns on at ≤1100px (tablet). Most pages only ship
    // .mm-nav / .mm-close rules under 640px, so on iPad the close button
    // stayed in document flow (huge empty SVG box) and nav links stayed
    // inline ("Shop About Contact…" on one line). Own the full layout here.
    css.textContent = [
      '@media (max-width:1100px){',
      '.mm-panel{',
      'display:flex!important;flex-direction:column;justify-content:flex-start!important;',
      'overflow-y:auto;-webkit-overflow-scrolling:touch;',
      'position:fixed;inset:0;z-index:55;',
      'background:var(--idr-stone,#EDE6DE);color:var(--idr-charcoal,#252522);',
      'padding:88px 28px 40px;box-sizing:border-box;',
      '}',
      '.mm-panel.is-open{opacity:1!important;visibility:visible!important;pointer-events:auto!important}',
      '.mm-close{',
      'position:absolute!important;top:18px;right:16px;width:44px;height:44px;',
      'border:none;background:transparent;padding:0;margin:0;cursor:pointer;',
      'color:var(--idr-charcoal,#252522);display:inline-flex!important;',
      'align-items:center;justify-content:center;z-index:2;flex:none;',
      '}',
      '.mm-close svg{display:block;width:22px;height:22px;stroke:currentColor;stroke-width:1.6;fill:none}',
      '.mm-nav{display:flex!important;flex-direction:column!important;align-items:flex-start;gap:22px;margin:0;padding:0}',
      '.mm-nav a{',
      'display:block;font-family:"Cormorant Garamond",Georgia,serif;font-weight:500;',
      'font-size:clamp(28px,4vw,36px);letter-spacing:-0.01em;line-height:1.1;',
      'color:var(--idr-charcoal,#252522);text-decoration:none;',
      '}',
      '.mm-info{display:flex!important;flex-direction:column;align-items:flex-start;gap:14px;margin:40px 0 32px}',
      '.mm-label{margin:0 0 2px;font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--idr-taupe,#8a8175)}',
      '.mm-info a{display:block;font-size:15px;line-height:1.3;color:var(--idr-charcoal,#252522);text-decoration:none}',
      '.mm-utils{',
      'display:flex!important;margin-top:auto;align-items:center;gap:22px;',
      'padding-top:32px;border-top:1px solid rgba(37,37,34,.08);',
      '}',
      '.mm-utils .mm-icon{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;margin:0;padding:0;',
      'border:0;background:none;color:var(--idr-charcoal,#252522);cursor:pointer;position:relative;text-decoration:none}',
      '.mm-utils .mm-icon svg,.mm-utils .saved-icon{width:20px;height:20px;display:block}',
      '.mm-utils .lang-toggle{margin-left:auto;color:var(--idr-charcoal,#252522);font-size:11px;letter-spacing:.28em;text-transform:uppercase}',
      'html.mm-open,html.mm-open body{overflow:hidden!important}',
      '}'
    ].join('');
    document.head.appendChild(css);
  }

  function onMenuSearch(e) {
    var btn = e.target.closest && e.target.closest('[data-mm-search]');
    if (!btn) return;
    e.preventDefault();
    var close = document.getElementById('mm-close');
    if (close) close.click();
    var open = document.getElementById('search-open');
    if (open) open.click();
  }

  // ── Shop dropdown page dim ─────────────────────────────────────────────
  // Soft wash behind the Shop panel on every page (Home hero included).
  // The nav bar itself dims too; only the white dropdown stays clear.
  function injectShopScrim() {
    var css = document.getElementById('idr-shop-scrim-css');
    if (!css) {
      css = document.createElement('style');
      css.id = 'idr-shop-scrim-css';
      document.head.appendChild(css);
    }
    css.textContent = [
      '.shop-scrim{',
      'position:fixed;inset:0;z-index:39;',
      /* Soft veil — enough to lift the panel, not a blackout. */
      'background:rgba(49,47,35,.22);',
      'opacity:0;visibility:hidden;pointer-events:none;',
      'transition:opacity .35s cubic-bezier(.22,1,.36,1),visibility .35s;',
      '}',
      /* Home sticky bar is z 1200 — sit just under it so the hero dims too. */
      'html:has(#site-nav) .shop-scrim{z-index:1190;}',
      'html:has(#nav-shop.is-open) .shop-scrim{',
      'opacity:1;visibility:visible;pointer-events:auto;',
      '}',
      /* Keep the bar frosted (not fully clear) so page content cannot bleed
         through the header — that looked like a broken Shop hover. */
      'html:has(#nav-shop.is-open) .site-nav,',
      'html:has(#nav-shop.is-open) .shop-header{',
      'background:rgba(237,230,222,.88)!important;',
      '-webkit-backdrop-filter:blur(8px);',
      'backdrop-filter:blur(8px);',
      'border-bottom-color:rgba(37,37,34,.06)!important;',
      '}',
      'html:has(#nav-shop.is-open) .site-nav,',
      'html:has(#nav-shop.is-open) .shop-header{overflow:visible!important;}',
      'html:has(#nav-shop.is-open) .site-nav .hero-nav>a,',
      'html:has(#nav-shop.is-open) .site-nav #nav-shop-trigger,',
      'html:has(#nav-shop.is-open) .site-nav .hero-utils .utils-cluster,',
      'html:has(#nav-shop.is-open) .site-nav .hero-utils>:not(.utils-cluster),',
      'html:has(#nav-shop.is-open) .shop-header>a,',
      'html:has(#nav-shop.is-open) .shop-nav>a,',
      'html:has(#nav-shop.is-open) .shop-nav #nav-shop-trigger,',
      'html:has(#nav-shop.is-open) .shop-utils .utils-cluster,',
      'html:has(#nav-shop.is-open) .shop-utils>:not(.utils-cluster){',
      'opacity:.7;',
      'transition:opacity .35s cubic-bezier(.22,1,.36,1);',
      '}',
      /* Dropdown stays fully solid and above the wash. */
      'html:has(#nav-shop.is-open) .nav-panel,',
      'html:has(#nav-shop.is-open) .nav-panel-inner{opacity:1!important;}',
    ].join('');
  }

  function ensureShopScrim() {
    injectShopScrim();
    var el = document.getElementById('shop-scrim');
    if (!el) {
      el = document.createElement('div');
      el.id = 'shop-scrim';
      el.className = 'shop-scrim';
      el.setAttribute('aria-hidden', 'true');
      var host = document.body || document.documentElement;
      host.insertBefore(el, host.firstChild);
    }
    if (el.getAttribute('data-idr-bound') === '1') return;
    el.setAttribute('data-idr-bound', '1');
    el.addEventListener('click', function () {
      var item = document.getElementById('nav-shop');
      var trigger = document.getElementById('nav-shop-trigger');
      if (item) item.classList.remove('is-open');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  }

  // ── Header utils: three spaced clusters ────────────────────────────────
  // 1) language  2) search + saved  3) Info + Enquiry
  function injectUtilsClusterCss() {
    var css = document.getElementById('idr-utils-cluster-css');
    if (!css) {
      css = document.createElement('style');
      css.id = 'idr-utils-cluster-css';
      document.head.appendChild(css);
    }
    css.textContent = [
      '.hero-utils,.shop-utils{',
      'display:flex!important;align-items:center;gap:40px!important;',
      '}',
      '.hero-utils .utils-cluster,.shop-utils .utils-cluster{',
      'display:inline-flex;align-items:center;gap:18px;',
      '}',
      '.hero-utils .utils-cluster--links > a:not(.saved-link),',
      '.shop-utils .utils-cluster--links > a:not(.saved-link),',
      '.hero-utils .utils-cluster--links .info-menu-trigger,',
      '.shop-utils .utils-cluster--links .info-menu-trigger{',
      // line-height: Info is a <button> pinned to 1 while Enquiry is an <a> on
      // `normal` (~1.37). Both boxes centre, but the half-leading differs, so
      // the glyphs sat on different baselines — Info high, Enquiry low. One
      // line-height puts them on the same one. Vertical only; no spacing change.
      'letter-spacing:.24em;margin-inline-end:-.24em;line-height:1;',
      '}',
      // The two icons carried empty space the text does not: a 20px box around
      // an 18px svg (1px a side), and neither drawing filled its own 0 0 24 24
      // viewBox — search inked x2.8–22.7, the bookmark only x4.8–19.2. The
      // viewBoxes are cropped to the artwork in groupHeaderUtils below, so the
      // box here is sized to the glyph itself: no padding left to cancel. The
      // numbers are the inked extents × 0.75 (the old 18/24 render scale), so
      // the icons draw at exactly the size they always did.
      // Scoped to the header clusters; the mobile menu's copies are untouched.
      '.hero-utils .utils-cluster--tools .search-open-btn,',
      '.shop-utils .utils-cluster--tools .search-open-btn,',
      '.hero-utils .utils-cluster--tools .search-open-btn svg,',
      '.shop-utils .utils-cluster--tools .search-open-btn svg{',
      'width:14.93px;height:14.93px;',
      '}',
      '.hero-utils .utils-cluster--tools .saved-link,',
      '.shop-utils .utils-cluster--tools .saved-link,',
      '.hero-utils .utils-cluster--tools .saved-icon,',
      '.shop-utils .utils-cluster--tools .saved-icon{',
      'width:10.8px;height:13.43px;',
      '}',
      // Badge re-anchored to the tightened box so it lands where it always did
      // relative to the bookmark: 8.29px above its top, 13.6px past its right.
      '.hero-utils .utils-cluster--tools .saved-count,',
      '.shop-utils .utils-cluster--tools .saved-count{',
      'top:-8.29px;right:-13.6px;',
      '}',
      // Same problem on the language toggle: the inactive code (FR while EN is
      // on) is collapsed to width:0 but is still a flex item, so the toggle's
      // 6px gap is allocated before it and sits as dead space after EN. Cancel
      // that gap. Keyed off :not(.is-on) so it follows whichever code is off,
      // and -6px matches the toggle's gap either side of it.
      '.hero-utils .utils-cluster--lang .lang-code:not(.is-on),',
      '.shop-utils .utils-cluster--lang .lang-code:not(.is-on){',
      'margin-inline-start:-6px;',
      '}',
      // Saved is the last item in the tools cluster and its count badge is
      // absolutely positioned at right:-9px, so it hangs into the 40px gap and
      // that gap reads short. Push the cluster back by the overhang while the
      // badge shows, so the gap is measured from the badge's edge — the same
      // trick the letter-spacing cancel above does for the text. 13.6px is how
      // far the badge now sits past the tightened box's right edge.
      '.hero-utils .utils-cluster--tools:has(.saved-count:not([hidden]):not(:empty)),',
      '.shop-utils .utils-cluster--tools:has(.saved-count:not([hidden]):not(:empty)){',
      'margin-inline-end:13.6px;',
      '}',
      '@media (max-width:1100px){',
      '.shop-utils .utils-cluster{display:none!important;}',
      '.hero-utils .utils-cluster{display:none!important;}',
      '}',
    ].join('');
  }

  // Idempotent: re-running must not re-crop an already-cropped icon.
  function cropIconViewBox(host, viewBox) {
    var svg = host && host.querySelector('svg');
    if (!svg || svg.getAttribute('data-idr-cropped') === '1') return;
    svg.setAttribute('viewBox', viewBox);
    svg.setAttribute('data-idr-cropped', '1');
    // The markup carries width/height attributes; CSS sizes the box instead.
    svg.removeAttribute('width');
    svg.removeAttribute('height');
  }

  function groupHeaderUtils() {
    injectUtilsClusterCss();
    var roots = document.querySelectorAll('.hero-utils, .shop-utils');
    Array.prototype.forEach.call(roots, function (root) {
      if (!root || root.getAttribute('data-idr-grouped') === '1') return;
      var lang = root.querySelector(':scope > .lang-toggle');
      var search = root.querySelector(':scope > .search-open-btn');
      var saved = root.querySelector(':scope > .saved-link');
      var info = root.querySelector(':scope > .info-menu');
      var enquiry = root.querySelector(':scope > a[data-i18n="nav.enquiry"]');
      var mm = root.querySelector(':scope > .mm-toggle');
      if (!lang && !search && !saved && !info && !enquiry) return;

      function cluster(name) {
        var el = document.createElement('div');
        el.className = 'utils-cluster utils-cluster--' + name;
        return el;
      }
      var cLang = cluster('lang');
      var cTools = cluster('tools');
      var cLinks = cluster('links');
      if (lang) cLang.appendChild(lang);
      // Crop each icon's viewBox to the artwork's inked extents (path bounds
      // plus the 1.4 stroke), so the svg box IS the glyph with no transparent
      // margin inside it. `search` and `saved` are the header's own icons —
      // the mobile menu's identical copies are never matched here.
      cropIconViewBox(search, '2.8 2.8 19.9 19.9');
      cropIconViewBox(saved, '4.8 3.05 14.4 17.9');
      if (search) cTools.appendChild(search);
      if (saved) cTools.appendChild(saved);
      if (info) cLinks.appendChild(info);
      if (enquiry) cLinks.appendChild(enquiry);

      var frag = document.createDocumentFragment();
      if (cLang.childNodes.length) frag.appendChild(cLang);
      if (cTools.childNodes.length) frag.appendChild(cTools);
      if (cLinks.childNodes.length) frag.appendChild(cLinks);
      if (mm) frag.appendChild(mm);
      root.insertBefore(frag, root.firstChild);
      root.setAttribute('data-idr-grouped', '1');
    });
  }

  // ── Primary nav current underline ──────────────────────────────────────
  // Contact already ships .is-current; other primary pages were missing it.
  function injectNavCurrentCss() {
    var css = document.getElementById('idr-nav-current-css');
    if (!css) {
      css = document.createElement('style');
      css.id = 'idr-nav-current-css';
      document.head.appendChild(css);
    }
    css.textContent = [
      '.shop-nav>a.is-current,.shop-nav .nav-item>a.is-current{position:relative}',
      '.shop-nav>a.is-current::after,.shop-nav .nav-item>a.is-current::after{',
      'content:"";position:absolute;left:0;right:0;bottom:-6px;height:1px;background:currentColor',
      '}',
    ].join('');
  }

  function markNavCurrent() {
    injectNavCurrentCss();
    var nav = document.querySelector('.shop-nav');
    if (!nav) return;
    var file = (location.pathname || location.href || '')
      .split(/[\\/]/)
      .pop()
      .toLowerCase()
      .split('?')[0]
      .split('#')[0];
    var key = null;
    if (file === 'shop.dc.html' || file === 'product.dc.html') key = 'shop';
    else if (file === 'story.dc.html') key = 'story';
    else if (file === 'contact.dc.html') key = 'contact';
    else if (file === 'trade.dc.html') key = 'collaborate';
    else return;

    var tops = nav.querySelectorAll(':scope > a, :scope > .nav-item > a');
    if (!tops.length) {
      tops = nav.querySelectorAll('a');
    }
    Array.prototype.forEach.call(tops, function (a) {
      if (a.closest && a.closest('.nav-panel')) return;
      a.classList.remove('is-current');
      a.removeAttribute('aria-current');
    });

    var target = null;
    if (key === 'shop') target = document.getElementById('nav-shop-trigger');
    else if (key === 'story') target = nav.querySelector('a[href*="Story.dc.html"]');
    else if (key === 'contact') target = nav.querySelector(':scope > a[href*="Contact.dc.html"]') || nav.querySelector('a[href*="Contact.dc.html"]');
    else if (key === 'collaborate') target = nav.querySelector(':scope > a[href*="Trade.dc.html"]') || nav.querySelector('a[href*="Trade.dc.html"]');

    if (target && !(target.closest && target.closest('.nav-panel'))) {
      target.classList.add('is-current');
      target.setAttribute('aria-current', 'page');
    }
  }

  if (typeof document !== 'undefined') {
    if (document.head) injectMenuCss();
    else document.addEventListener('DOMContentLoaded', injectMenuCss);
    document.addEventListener('click', onMenuSearch);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        mountSavedLinks();
        mountSavedPage();
        ensureShopScrim();
        markNavCurrent();
        groupHeaderUtils();
      });
    } else {
      mountSavedLinks();
      mountSavedPage();
      ensureShopScrim();
      markNavCurrent();
      groupHeaderUtils();
    }
    // The dc runtime builds the page after DOMContentLoaded, so re-sync once
    // the header actually exists.
    global.addEventListener('load', function () {
      syncSavedLinks();
      ensureShopScrim();
      markNavCurrent();
      groupHeaderUtils();
    });
  }

  // ── Scroll root fix ────────────────────────────────────────────────────
  // support.js injects: html,body{height:100%} #dc-root,.sc-host{height:100%}
  // That traps a long marketing page in a viewport-tall shell. The real
  // scroll then sits on an inner node (dual scrollbars), while our smooth
  // scroll calls preventDefault + window.scrollTo — which barely moves
  // (maxScroll ≈ 0) and blocks the inner scroller. Result: scroll feels
  // stuck / interrupted. Unlock the document so the window is the only
  // scroll owner.
  function injectScrollRootFix() {
    var css = document.getElementById('idr-scroll-root-fix');
    if (!css) {
      css = document.createElement('style');
      css.id = 'idr-scroll-root-fix';
      document.head.appendChild(css);
    }
    // ROOT CAUSE of sticky/scroll breakage:
    // support.js sets height:100% on html/body. We unlock height so the
    // document can grow. Do NOT set overflow-y:auto on html/body — if either
    // axis is not `visible`, the other computes to `auto` too, html becomes a
    // scroll container, and position:sticky fails for the whole page (Shop
    // browse bar, Home site-nav). Leave overflow at the initial `visible`
    // and let the viewport scroll.
    css.textContent = [
      'html,body{height:auto!important;min-height:100%!important;overflow:visible!important;}',
      '#dc-root,#dc-root>.sc-host{height:auto!important;min-height:100%!important;overflow:visible!important;}',
      'html.hero-intro-lock,html.hero-intro-lock body{overflow:visible!important;height:auto!important;touch-action:auto!important;}',
      /* Search / mobile menu must lock the page. The unlock above used
         !important and was winning over html.search-open{overflow:hidden},
         so the page scrolled under the overlay (looked broken). */
      'html.search-open,html.search-open body,',
      'html.mm-open,html.mm-open body{',
      'overflow:hidden!important;',
      '}',
      /* Sticky nav is z 1200 — search must sit above it. */
      '.search-overlay{z-index:1300!important;}',
      '.search-overlay.is-open{z-index:1300!important;}',
    ].join('');
  }

  // ── Tablet chrome ──────────────────────────────────────────────────────
  // Full desktop nav (Shop…Collaborate + utils) collides under ~1100px.
  // Collapse to logo + burger across every page; phone keeps its own insets.
  function injectTabletChrome() {
    var css = document.getElementById('idr-tablet-chrome');
    if (!css) {
      css = document.createElement('style');
      css.id = 'idr-tablet-chrome';
      document.head.appendChild(css);
    }
    css.textContent = [
      '@media (max-width:1100px){',
      '.shop-header{',
      'display:flex!important;',
      'justify-content:space-between!important;',
      'align-items:center!important;',
      'grid-template-columns:none!important;',
      'gap:16px!important;',
      '}',
      '.shop-nav{display:none!important;}',
      '.shop-utils>*:not(.mm-toggle){display:none!important;}',
      '.mm-toggle{',
      'display:inline-flex!important;',
      'flex-direction:column;',
      'justify-content:center;',
      'align-items:center;',
      'gap:4.5px;',
      'width:32px;',
      'height:32px;',
      'border:none;',
      'background:transparent;',
      'padding:0;',
      'cursor:pointer;',
      'color:var(--idr-charcoal);',
      'position:relative;',
      'z-index:2;',
      '-webkit-appearance:none;',
      'appearance:none;',
      '}',
      '.mm-toggle span{',
      'display:block;',
      'width:20px;',
      'height:1.5px;',
      'background:currentColor;',
      '}',
      '.mm-panel{',
      'display:flex!important;',
      'flex-direction:column;',
      'justify-content:flex-start;',
      'overflow-y:auto;',
      '-webkit-overflow-scrolling:touch;',
      'position:fixed;',
      'inset:0;',
      'z-index:55;',
      'background:var(--idr-stone);',
      'color:var(--idr-charcoal);',
      'padding:88px 28px 40px;',
      'opacity:0;',
      'visibility:hidden;',
      'pointer-events:none;',
      '}',
      '.mm-panel.is-open{',
      'opacity:1!important;',
      'visibility:visible!important;',
      'pointer-events:auto!important;',
      '}',
      /* Home — same breakpoint: sticky link bar off, burger + home-chrome on */
      '.site-nav{display:none!important;}',
      '.home-chrome{display:block!important;}',
      '.mm-toggle--float{',
      'display:inline-flex!important;',
      'position:fixed;',
      'right:18px;',
      'z-index:60;',
      '}',
      '}',
      '@media (min-width:1101px){',
      '.home-chrome{display:none!important;}',
      '}',
    ].join('');
  }

  // ── Sitewide section rhythm ────────────────────────────────────────────
  // One fixed top/bottom space for content sections across every page.
  // Ideal: not sparse (100–130px), not tight (40px) — Story's measured
  // clamp. Hero / sticky chrome keep their own spacing; only vertical
  // padding is forced so horizontal insets stay per-page.
  // ── No entrance effects ────────────────────────────────────────────────
  // Client request: nothing fades, slides or scales in on any page. Every
  // block, image and video is in place from the first paint, and changing
  // a Shop category swaps content without a transition.
  function injectFadeOnlyReveal() {
    var css = document.getElementById('idr-fade-reveal-css');
    if (!css) {
      css = document.createElement('style');
      css.id = 'idr-fade-reveal-css';
      document.head.appendChild(css);
    }
    css.textContent = [
      /* Kill entrance zoom on every page — sit still on first paint. */
      '.cat-hero-media img,.cat-hero.is-ready .cat-hero-media img,',
      '#story .story-media-frame img,.collab-media img,',
      '.trade-hero-media img,.trade-proof-media img,',
      '.story-wide-media img,.story-wide-media.is-in img,',
      '.reveal-media img,.product-media img,.shelf-media img,.saved-item-media img{',
      'transform:none!important;',
      '}',
      /* Framed photos fill a reserved box (aspect-ratio on the frame). */
      '.product-media img,.shelf-media img,.saved-item-media img,',
      '.cat-hero-media img,.story-media-frame img,.collab-media img,',
      '.trade-hero-media img,.trade-proof-media img,.pdp-media img{',
      'max-width:none;',
      '}',

      /* Scroll-reveal blocks, framed media, product cards, story lines and
         the Shop category banner copy: visible and still from first paint. */
      '.reveal,.reveal.is-in,.reveal-media,.reveal-media.is-in,',
      '.reveal-media img:not(.shelf-img-hover),.reveal-media video,',
      '.product-card .product-tile,',
      '#story .story-copy .story-line,#story .story-head .story-line,#who .who-line,',
      '.cat-hero-copy,',
      '.cat-hero.is-swap .cat-hero-copy h1,.cat-hero.is-swap .cat-hero-copy p,.cat-hero.is-swap .cat-hero-cta{',
      'opacity:1!important;',
      'transform:none!important;',
      'transition-delay:0s!important;',
      '}',

      /* New Arrivals hover lifestyle shots stay hidden until hovered. */
      '.shelf-media img.shelf-img-hover{opacity:0!important;}',
      '@media (hover:hover) and (pointer:fine){',
      '#shop .shelf-card:hover .shelf-media img.shelf-img-default{opacity:0!important;}',
      '#shop .shelf-card:hover .shelf-media img.shelf-img-hover{opacity:1!important;}',
      '}',
      '@media (prefers-reduced-motion:reduce){',
      '#shop .shelf-card:hover .shelf-media img.shelf-img-default{opacity:1!important;}',
      '#shop .shelf-card:hover .shelf-media img.shelf-img-hover{opacity:0!important;}',
      '}',
    ].join('');
  }

  // Footer “Letters from the Atlas” sits inside the dark shop-footer.
  // Pull it onto a light full-bleed band; leave the rest of the footer dark.
  function injectNewsletterLight() {
    if (document.getElementById('idr-nl-light-css')) return;
    var css = document.createElement('style');
    css.id = 'idr-nl-light-css';
    css.textContent = [
      '.shop-footer{padding-top:0!important;}',
      '.shop-footer-top{',
      'background:var(--idr-stone,#ede6de)!important;',
      'color:var(--idr-charcoal,#252522)!important;',
      'border-top:1px solid rgba(37,37,34,.14)!important;',
      'border-bottom:1px solid rgba(37,37,34,.08)!important;',
      'margin:0 calc(-1 * var(--idr-inset,48px)) 72px!important;',
      'padding:clamp(56px,6.2vw,88px) var(--idr-inset,48px)!important;',
      'box-sizing:border-box;',
      '}',
      '.shop-footer-top [data-i18n="footer.letters"]{',
      'color:var(--idr-charcoal,#252522)!important;',
      '}',
      '.shop-footer-top [data-i18n="footer.lettersBody"]{',
      'color:var(--idr-taupe,#8a8175)!important;',
      '}',
      '.shop-footer-top form{',
      'border-bottom-color:rgba(37,37,34,.22)!important;',
      '}',
      '.shop-footer-top input,',
      '.shop-footer-top button{',
      'color:var(--idr-charcoal,#252522)!important;',
      '}',
      '.shop-footer-top input::placeholder{',
      'color:var(--idr-taupe,#8a8175)!important;',
      'opacity:.75;',
      '}',
      /* Home mid-page newsletter — keep / enforce light. */
      '.nl-home-band{',
      'background:var(--idr-stone,#ede6de)!important;',
      'color:var(--idr-charcoal,#252522)!important;',
      '}',
    ].join('');
    document.head.appendChild(css);
  }

  function injectSectionRhythm() {
    if (document.getElementById('idr-section-rhythm')) return;
    var css = document.createElement('style');
    css.id = 'idr-section-rhythm';
    css.textContent = [
      ':root{',
      '--idr-section-y:clamp(56px,6.2vw,88px);',
      '--section-y:var(--idr-section-y);',
      '}',

      /* Home — avoid stacking full section-y on both sides of a join */
      '#who{',
      'padding-top:var(--idr-section-y)!important;',
      'padding-bottom:clamp(20px,2.4vw,28px)!important;',
      '}',
      '#story{',
      'padding-top:clamp(48px,5vw,56px)!important;',
      'padding-bottom:var(--idr-section-y)!important;',
      '}',
      '#reviews,#reviews.reviews-home,#contact.contact,.nl-home-band{',
      'padding-top:var(--idr-section-y)!important;',
      'padding-bottom:var(--idr-section-y)!important;',
      '}',
      '#shop.shelf,.shelf{padding-bottom:clamp(48px,5vw,56px)!important;}',
      '.shelf-intro{padding-top:clamp(32px,4vw,40px)!important;padding-bottom:clamp(40px,4.5vw,48px)!important;}',
      '#collaborate .collab-copy,.collab-copy{',
      'padding-top:var(--idr-section-y)!important;',
      'padding-bottom:var(--idr-section-y)!important;',
      '}',

      /* About (Story) — already tokenised; keep in lockstep */
      '.story-block,',
      '.band-ivory.story-block,',
      '.band-dark.story-block,',
      '.story-block.story-block--tight,',
      '.story-block.story-block--after-wide,',
      '.story-quote-band.story-quote-band,',
      '.phil-item.phil-item,',
      '.story-stills.story-stills,',
      '.story-end-copy.story-end-copy{',
      'padding-top:var(--idr-section-y)!important;',
      'padding-bottom:var(--idr-section-y)!important;',
      '}',
      '.phil.phil{padding-top:var(--idr-section-y)!important;padding-bottom:0!important;}',

      /* Trade / Collaborate */
      '.trade-hero-copy,',
      '.trade-offer,',
      '.trade-proof-copy,',
      '.trade-end{',
      'padding-top:var(--idr-section-y)!important;',
      'padding-bottom:var(--idr-section-y)!important;',
      '}',

      /* Contact / Custom / legal / info pages */
      '.contact-page,',
      '.legal{',
      'padding-top:var(--idr-section-y)!important;',
      'padding-bottom:var(--idr-section-y)!important;',
      '}',

      /* Shop */
      '.shop-collection,',
      '.samples-panel,',
      '.shop-cue{',
      'padding-top:var(--idr-section-y)!important;',
      'padding-bottom:var(--idr-section-y)!important;',
      '}',

      /* Product */
      '.pdp-enquire-block,',
      '.pdp-enquire-block.is-open{',
      'padding-top:var(--idr-section-y)!important;',
      'padding-bottom:var(--idr-section-y)!important;',
      '}',
      '.pdp-more{padding-bottom:var(--idr-section-y)!important;}',

      /* Saved */
      '.saved-page{',
      'padding-top:var(--idr-section-y)!important;',
      'padding-bottom:var(--idr-section-y)!important;',
      '}',

      /* Footers — same vertical breath before the close */
      'footer.on-dark,',
      '.shop-footer{',
      'padding-top:var(--idr-section-y)!important;',
      'padding-bottom:var(--idr-section-y)!important;',
      '}',
    ].join('');
    document.head.appendChild(css);
  }

  if (typeof document !== 'undefined') {
    if (document.head) {
      injectScrollRootFix();
      injectSectionRhythm();
      injectTabletChrome();
      injectFadeOnlyReveal();
      injectNewsletterLight();
      injectUtilsClusterCss();
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        injectScrollRootFix();
        injectSectionRhythm();
        injectTabletChrome();
        injectFadeOnlyReveal();
        injectNewsletterLight();
        injectUtilsClusterCss();
      });
    }
  }

  // ── Back to top (sitewide) ─────────────────────────────────────────────
  // Ideal logic: show after ~1 viewport, hide near top (hysteresis), one
  // scroll owner with the page smooth-scroll bridge, wheel cancels the trip.
  var smoothBridge = null;
  var toTopApi = null;

  function setSmoothBridge(bridge) {
    smoothBridge = bridge || null;
  }

  function cancelToTop() {
    if (toTopApi && typeof toTopApi.cancel === 'function') toTopApi.cancel();
  }

  function injectToTopCss() {
    if (document.getElementById('idr-to-top-css')) return;
    var css = document.createElement('style');
    css.id = 'idr-to-top-css';
    css.textContent = [
      '.to-top{position:fixed;right:24px;bottom:24px;z-index:120;',
      'display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;padding:0;',
      'border:1px solid rgba(232,216,200,.28);background:rgba(31,30,22,.88);color:var(--idr-ivory,#E8D8C8);',
      'cursor:pointer;-webkit-tap-highlight-color:transparent;font-family:inherit;font-size:10px;',
      'font-weight:500;letter-spacing:.28em;text-transform:uppercase;opacity:0;visibility:hidden;',
      'pointer-events:none;transform:translate3d(0,10px,0);transition:opacity .35s cubic-bezier(.22,1,.36,1),',
      'transform .4s cubic-bezier(.22,1,.36,1),visibility .35s,background .35s ease,border-color .35s ease,color .35s ease}',
      '.to-top.is-shown{opacity:1;visibility:visible;pointer-events:auto;transform:translate3d(0,0,0)}',
      '.to-top svg{width:15px;height:15px;flex:0 0 auto;stroke:currentColor;fill:none;stroke-width:1.35;',
      'stroke-linecap:round;stroke-linejoin:round;transition:transform .3s cubic-bezier(.22,1,.36,1)}',
      '.to-top:hover{background:var(--idr-ivory,#E8D8C8);border-color:var(--idr-ivory,#E8D8C8);color:var(--idr-charcoal,#252522)}',
      '.to-top:hover svg{transform:translate3d(0,-2px,0)}',
      '.to-top:focus-visible{outline:1px dashed currentColor;outline-offset:4px}',
      '.to-top.is-on-light{background:rgba(245,240,230,.92);border-color:var(--idr-charcoal-08,rgba(37,37,34,.08));',
      'color:var(--idr-charcoal,#252522)}',
      '.to-top.is-on-light:hover{background:var(--idr-charcoal,#252522);border-color:var(--idr-charcoal,#252522);color:var(--idr-ivory,#E8D8C8)}',
      '@media (max-width:640px){.to-top{right:16px;bottom:16px;width:40px;height:40px}}',
      /* Menu owns the screen — keep Top from stacking over EN / menu chrome. */
      'html.mm-open .to-top{opacity:0!important;visibility:hidden!important;pointer-events:none!important}',
    ].join('');
    document.head.appendChild(css);
  }

  function ensureToTopButton() {
    var btn = document.getElementById('to-top');
    if (btn) return btn;
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'to-top';
    btn.id = 'to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML =
      '<svg viewBox="0 0 14 14" aria-hidden="true">' +
      '<path d="M7 11.5V2.5"/>' +
      '<path d="M3.2 6.2L7 2.5l3.8 3.7"/>' +
      '</svg>';
    document.body.appendChild(btn);
    return btn;
  }

  function mountToTop(opts) {
    opts = opts || {};
    if (typeof document === 'undefined') return null;
    if (toTopApi && toTopApi.btn && document.body.contains(toTopApi.btn)) {
      return toTopApi;
    }

    injectToTopCss();
    var btn = ensureToTopButton();
    btn.hidden = false;
    btn.dataset.idrMounted = '1';

    var reduceMotion = false;
    try {
      reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {}

    var busy = false;
    var visible = false;
    var rafGo = null;
    var footer =
      document.querySelector('footer.on-dark') ||
      document.querySelector('footer.shop-footer') ||
      document.querySelector('footer');

    function maxScroll() {
      return Math.max(
        0,
        Math.max(
          document.documentElement.scrollHeight,
          document.body ? document.body.scrollHeight : 0
        ) - window.innerHeight
      );
    }

    function sync() {
      if (busy) return;
      var y = window.scrollY || window.pageYOffset || 0;
      var vh = window.innerHeight || 1;
      var locked = document.documentElement.classList.contains('hero-intro-lock');
      // Client: only surface Top once the page is ~70% read. A little
      // hysteresis so it doesn't flicker on the threshold.
      var max = maxScroll();
      var progress = max > 0 ? y / max : 0;
      var tallEnough = max > vh * 0.55;

      if (locked || !tallEnough) {
        visible = false;
      } else if (!visible && progress >= 0.7) {
        visible = true;
      } else if (visible && progress < 0.66) {
        visible = false;
      }

      btn.classList.toggle('is-shown', visible);

      var overDark = false;
      if (footer && visible) {
        var r = footer.getBoundingClientRect();
        var dark =
          footer.classList.contains('on-dark') ||
          footer.classList.contains('shop-footer');
        overDark = dark && r.top < vh - 24;
      }
      btn.classList.toggle('is-on-light', visible && !overDark);
    }

    function finish() {
      busy = false;
      if (rafGo != null) {
        cancelAnimationFrame(rafGo);
        rafGo = null;
      }
      if (smoothBridge && typeof smoothBridge.set === 'function') {
        smoothBridge.set(window.scrollY || window.pageYOffset || 0);
      }
      sync();
    }

    function cancel() {
      if (!busy && rafGo == null) return;
      if (rafGo != null) {
        cancelAnimationFrame(rafGo);
        rafGo = null;
      }
      if (smoothBridge && typeof smoothBridge.abort === 'function') smoothBridge.abort();
      busy = false;
      sync();
    }

    function goTopSelf(start) {
      var t0 = performance.now();
      var duration = Math.max(420, Math.min(780, 420 + start * 0.08));
      var step = function (now) {
        var t = Math.min(1, (now - t0) / duration);
        var eased = 1 - Math.pow(1 - t, 3);
        var y = Math.round(start * (1 - eased));
        window.scrollTo(0, y);
        if (smoothBridge && typeof smoothBridge.set === 'function') smoothBridge.set(y);
        if (t < 1) {
          rafGo = requestAnimationFrame(step);
        } else {
          rafGo = null;
          finish();
        }
      };
      rafGo = requestAnimationFrame(step);
    }

    function goTop() {
      if (smoothBridge && typeof smoothBridge.abort === 'function') smoothBridge.abort();
      var start = window.scrollY || window.pageYOffset || 0;
      if (start <= 1) {
        finish();
        return;
      }
      if (reduceMotion) {
        window.scrollTo(0, 0);
        if (smoothBridge && typeof smoothBridge.set === 'function') smoothBridge.set(0);
        finish();
        return;
      }
      if (smoothBridge && typeof smoothBridge.goTo === 'function') {
        smoothBridge.goTo(0, finish, { fast: true });
        return;
      }
      goTopSelf(start);
    }

    function onClick(e) {
      e.preventDefault();
      if (busy) return;
      busy = true;
      goTop();
    }

    function onWheelCancel() {
      cancel();
    }

    function onScroll() { sync(); }
    function onResize() { sync(); }

    btn.addEventListener('click', onClick);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    // Passive: only cancels an in-flight Top trip; page smooth scroll owns preventDefault.
    window.addEventListener('wheel', onWheelCancel, { passive: true });
    window.addEventListener('touchstart', onWheelCancel, { passive: true });

    sync();

    toTopApi = {
      btn: btn,
      cancel: cancel,
      sync: sync,
      destroy: function () {
        cancel();
        btn.removeEventListener('click', onClick);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('wheel', onWheelCancel);
        window.removeEventListener('touchstart', onWheelCancel);
        toTopApi = null;
      },
    };
    return toTopApi;
  }

  function bootToTop() {
    try {
      mountToTop();
    } catch (e) {}
  }

  if (typeof document !== 'undefined') {
    if (document.head) injectToTopCss();
    else document.addEventListener('DOMContentLoaded', injectToTopCss);
    // dc pages hydrate after load — mount once the body exists, then retry shortly.
    global.addEventListener('load', function () {
      bootToTop();
      setTimeout(bootToTop, 120);
      setTimeout(bootToTop, 600);
    });
  }

  // ── Home site-nav pin ──────────────────────────────────────────────────
  // position:sticky fails inside the dc-runtime height:100% shell on some
  // previews. Pin with position:fixed once #hero leaves the viewport, and
  // keep a spacer so the page does not jump.
  function pinSiteNav(opts) {
    opts = opts || {};
    var nav = document.getElementById(opts.navId || 'site-nav');
    var anchor = document.getElementById(opts.anchorId || 'site-nav-anchor');
    var hero = document.getElementById(opts.heroId || 'hero');
    if (!nav || !anchor || !hero) return null;

    var pinned = false;
    var raf = 0;

    function apply(next) {
      if (next === pinned) return;
      pinned = next;
      if (pinned) {
        anchor.style.height = nav.offsetHeight + 'px';
        nav.classList.add('is-fixed');
      } else {
        nav.classList.remove('is-fixed');
        anchor.style.height = '0px';
      }
    }

    // Pin when the nav reaches the top of the viewport (sticky fallback).
    // Use the anchor while pinned so un-pin is stable. Ignore a zero-scroll
    // pre-layout glitch during the brand intro (hero.bottom can read <= 0
    // before paint).
    function shouldPin() {
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      if (
        y < 8 &&
        (hero.classList.contains('hero-stone') ||
          hero.classList.contains('hero-play') ||
          hero.classList.contains('hero-reveal'))
      ) {
        return false;
      }
      if (pinned) {
        return anchor.getBoundingClientRect().top <= 0;
      }
      return nav.getBoundingClientRect().top <= 0;
    }

    function sync() {
      raf = 0;
      apply(shouldPin());
    }

    function onScroll() {
      if (raf) return;
      raf = window.requestAnimationFrame(sync);
    }

    var io = null;
    if (typeof IntersectionObserver === 'function') {
      io = new IntersectionObserver(function () {
        sync();
      }, { threshold: [0, 0.01] });
      io.observe(hero);
    }

    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', onScroll);
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    sync();

    return {
      sync: sync,
      destroy: function () {
        if (raf) window.cancelAnimationFrame(raf);
        window.removeEventListener('scroll', onScroll, true);
        window.removeEventListener('resize', onScroll);
        document.removeEventListener('scroll', onScroll, true);
        if (io) io.disconnect();
        apply(false);
      },
    };
  }

  if (typeof document !== 'undefined') {
    var bootNavPin = function () {
      if (!document.getElementById('site-nav') || !document.getElementById('hero')) return false;
      if (global.__idrNavPin && typeof global.__idrNavPin.destroy === 'function') {
        try { global.__idrNavPin.destroy(); } catch (e) {}
      }
      global.__idrNavPin = pinSiteNav();
      return true;
    };
    var tryBootNavPin = function (attempt) {
      if (bootNavPin()) return;
      if (attempt > 40) return;
      setTimeout(function () { tryBootNavPin(attempt + 1); }, 100);
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { tryBootNavPin(0); });
    } else {
      tryBootNavPin(0);
    }
  }

  global.Idraren = {
    Wishlist: Wishlist,
    catalog: RUG_CATALOG,
    getCatalog: getRugCatalog,
    getRugById: getRugById,
    mountNewsletter: mountNewsletter,
    shouldShowNewsletter: shouldShowNewsletter,
    resetNewsletter: resetNewsletter,
    syncSavedLinks: syncSavedLinks,
    renderSavedPage: renderSavedPage,
    mountSavedPage: mountSavedPage,
    savedPopup: savedPopup,
    mountToTop: mountToTop,
    setSmoothBridge: setSmoothBridge,
    cancelToTop: cancelToTop,
    pinSiteNav: pinSiteNav,
  };
})(typeof window !== 'undefined' ? window : this);
