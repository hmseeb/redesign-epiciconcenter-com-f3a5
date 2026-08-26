/* =========================================================
   Epic Icon Center — site scripts
   Vanilla JS. No dependencies, no external APIs.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- sticky header state ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 24) header.classList.add('solid');
    else header.classList.remove('solid');
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- mobile navigation ---------- */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');

  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) header.classList.add('solid');
      else onScroll();
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });

    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) closeNav();
    });
  }

  /* ---------- scroll reveal ----------
     The entrance animation is progressive enhancement only. Content must never
     depend on it: if the observer never fires (unsupported API, print, or a
     full-page screenshot that captures beyond the viewport without scrolling)
     everything is force-revealed so nothing is left invisible. */
  var revealables = document.querySelectorAll('.reveal');

  function revealAll() {
    revealables.forEach(function (el) {
      el.style.transitionDelay = '0ms';
      el.classList.add('in');
    });
  }

  if ('IntersectionObserver' in window && revealables.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealables.forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i % 6, 5) * 70) + 'ms';
      io.observe(el);
    });

    // Safety net: never leave content hidden once the page has settled.
    window.addEventListener('load', function () {
      window.setTimeout(revealAll, 900);
    });
    window.setTimeout(revealAll, 4000);
    window.addEventListener('beforeprint', revealAll);
  } else {
    revealAll();
  }

  /* ---------- footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- contact form ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    var note = document.getElementById('formNote');
    var defaultNote = note ? note.innerHTML : '';

    var rules = {
      name: function (v) { return v.trim().length >= 2 ? '' : 'Please enter your name.'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please enter a valid email address.'; },
      subject: function (v) { return v.trim().length >= 2 ? '' : 'Please add a subject.'; },
      message: function (v) { return v.trim().length >= 10 ? '' : 'Please tell us a little about your event (10+ characters).'; }
    };

    function validateField(input) {
      var rule = rules[input.name];
      if (!rule) return true;
      var msg = rule(input.value);
      var field = input.closest('.field');
      var err = field ? field.querySelector('.error') : null;
      if (err) err.textContent = msg;
      if (field) field.classList.toggle('invalid', !!msg);
      return !msg;
    }

    form.querySelectorAll('input, textarea').forEach(function (input) {
      input.addEventListener('blur', function () { validateField(input); });
      input.addEventListener('input', function () {
        var field = input.closest('.field');
        if (field && field.classList.contains('invalid')) validateField(input);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var inputs = Array.prototype.slice.call(form.querySelectorAll('input, textarea'));
      var valid = true;
      var firstBad = null;

      inputs.forEach(function (input) {
        if (!validateField(input)) {
          valid = false;
          if (!firstBad) firstBad = input;
        }
      });

      if (!valid) {
        if (note) {
          note.classList.remove('success');
          note.textContent = 'Please correct the highlighted fields and try again.';
        }
        if (firstBad) firstBad.focus();
        return;
      }

      var data = {};
      inputs.forEach(function (input) { data[input.name] = input.value.trim(); });

      var body =
        'Name: ' + data.name + '\n' +
        'Email: ' + data.email + '\n\n' +
        data.message + '\n\n' +
        '— Sent from epiciconcenter.com';

      var href = 'mailto:Tye@epiciconcenter.com'
        + '?subject=' + encodeURIComponent('[Venue Inquiry] ' + data.subject)
        + '&body=' + encodeURIComponent(body);

      window.location.href = href;

      if (note) {
        note.classList.add('success');
        note.textContent = 'Thanks, ' + data.name.split(' ')[0] + ' — your email is opening now. If nothing happens, email Tye@epiciconcenter.com or call +1 (562) 967-0520.';
      }
      form.reset();

      window.setTimeout(function () {
        if (note) {
          note.classList.remove('success');
          note.innerHTML = defaultNote;
        }
      }, 12000);
    });
  }

  /* ---------- gallery filters + lightbox (gallery.html) ---------- */
  var masonry = document.querySelector('.masonry');
  if (masonry) {
    var figures = Array.prototype.slice.call(masonry.querySelectorAll('figure'));

    document.querySelectorAll('.filter').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.getAttribute('data-filter');
        document.querySelectorAll('.filter').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        figures.forEach(function (fig) {
          var match = cat === 'all' || fig.getAttribute('data-cat') === cat;
          fig.hidden = !match;
        });
      });
    });

    var lightbox = document.getElementById('lightbox');
    var lbImg = document.getElementById('lightboxImg');
    var lbCap = document.getElementById('lightboxCaption');
    var current = 0;

    function visibleFigures() {
      return figures.filter(function (f) { return !f.hidden; });
    }

    function show(index) {
      var list = visibleFigures();
      if (!list.length) return;
      current = (index + list.length) % list.length;
      var fig = list[current];
      var img = fig.querySelector('img');
      var cap = fig.querySelector('figcaption');
      lbImg.src = img.getAttribute('src');
      lbImg.alt = img.getAttribute('alt') || '';
      lbCap.textContent = cap ? cap.textContent : '';
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function hide() {
      lightbox.classList.remove('open');
      lbImg.removeAttribute('src');
      document.body.style.overflow = '';
    }

    if (lightbox && lbImg) {
      figures.forEach(function (fig) {
        fig.addEventListener('click', function () {
          show(visibleFigures().indexOf(fig));
        });
      });

      lightbox.addEventListener('click', function (e) {
        var action = e.target.getAttribute && e.target.getAttribute('data-lb');
        if (action === 'close' || e.target === lightbox) hide();
        else if (action === 'prev') show(current - 1);
        else if (action === 'next') show(current + 1);
      });

      window.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') hide();
        if (e.key === 'ArrowLeft') show(current - 1);
        if (e.key === 'ArrowRight') show(current + 1);
      });
    }
  }
})();
