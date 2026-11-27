// Before/after slider
    (function () {
      var ba = document.getElementById('baHero');
      if (!ba) return;
      var range = ba.querySelector('input[type="range"]');
      var afterImg = ba.querySelector('.after-img');
      var handle = ba.querySelector('.handle');
      function update() {
        var v = range.value;
        afterImg.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)';
        handle.style.left = v + '%';
      }
      range.addEventListener('input', update);
      update();
    })();

    // Theme toggle (live thing: swaps page ground between dark/light using app's two themes)
    (function () {
      var btn = document.getElementById('themeBtn');
      if (!btn) return;
      var meta = document.querySelector('meta[name="theme-color"]');
      function sync() {
        var light = document.documentElement.classList.contains('light');
        btn.setAttribute('aria-pressed', light ? 'true' : 'false');
        btn.textContent = light ? 'Temna tema' : 'Tema';
        if (meta) {
          meta.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
        }
      }
      btn.addEventListener('click', function () {
        document.documentElement.classList.toggle('light');
        sync();
      });
      sync();
    })();

    // Reveal on scroll
    (function () {
      var els = document.querySelectorAll('.reveal, .shutter');
      if (!('IntersectionObserver' in window)) {
        els.forEach(function (e) { e.classList.add('in'); });
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      els.forEach(function (e) { io.observe(e); });
    })();

    // Compare button scrolls to first comparison
    (function () {
      var b = document.getElementById('compareBtn');
      if (!b) return;
      b.addEventListener('click', function () {
        var t = document.getElementById('svetla');
        if (t) t.scrollIntoView({ behavior: 'smooth' });
      });
    })();
