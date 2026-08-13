/* Fond animé du hero — GrainGradient (Paper Shaders).
   Script classique (pas module) : support.js recrée les scripts du <helmet>
   lors de ses re-rendus React, et seuls les scripts classiques se ré-exécutent
   à chaque recréation. Le montage attend que #hero-shader existe dans le DOM
   visible et se refait si l'élément est recréé ; les gardes (dataset + canvas)
   empêchent tout double montage. */
(function () {
  if (window.__flattenHeroShader) return;
  window.__flattenHeroShader = true;

  var mounting = false;

  function mountHeroShader(host) {
    mounting = true;
    host.dataset.shaderMounted = '1';
    import('./vendor/paper-shaders.js')
      .then(function (mod) {
        var noiseTexture = mod.getShaderNoiseTexture();
        return noiseTexture.decode().then(function () {
          if (!host.isConnected) {
            delete host.dataset.shaderMounted;
            return;
          }
          var colors = ['#7300ff', '#eba8ff', '#00bfff', '#2a00ff'];
          var uniforms = {
            u_colorBack: mod.getShaderColorFromString('#09090B'),
            u_colors: colors.map(mod.getShaderColorFromString),
            u_colorsCount: colors.length,
            u_softness: 0.5,
            u_intensity: 0.5,
            u_noise: 0.25,
            u_shape: mod.GrainGradientShapes.corners,
            u_noiseTexture: noiseTexture,
            u_fit: mod.ShaderFitOptions.contain,
            u_scale: 1.35,
            u_rotation: 0,
            u_offsetX: 0,
            u_offsetY: 0,
            u_originX: 0.5,
            u_originY: 0.5,
            u_worldWidth: 0,
            u_worldHeight: 0
          };
          var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          new mod.ShaderMount(host, mod.grainGradientFragmentShader, uniforms, undefined, reduceMotion ? 0 : 1);
        });
      })
      .catch(function (e) {
        delete host.dataset.shaderMounted;
        console.warn('Fond animé indisponible (WebGL requis) :', e);
      })
      .finally(function () {
        mounting = false;
        // support.js a pu recréer l'élément pendant le montage : on revérifie
        ensureHeroShader();
      });
  }

  function ensureHeroShader() {
    if (mounting) return;
    var host = document.getElementById('hero-shader');
    if (host && !host.dataset.shaderMounted && !host.querySelector('canvas')) {
      mountHeroShader(host);
    }
  }

  ensureHeroShader();
  new MutationObserver(ensureHeroShader).observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Filet de sécurité : re-tente pendant 15 s, s'arrête dès que le canvas est là
  var tries = 0;
  var poll = setInterval(function () {
    var host = document.getElementById('hero-shader');
    if ((host && host.querySelector('canvas')) || ++tries > 50) clearInterval(poll);
    else ensureHeroShader();
  }, 300);
})();
