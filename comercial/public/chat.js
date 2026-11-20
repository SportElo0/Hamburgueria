/*
 * Growlift Comercial: chat button for any site.
 * <script src="https://<plataforma>/chat.js" data-chave="pk_..." async></script>
 * Optional: data-texto="Fale com a gente" data-cor="#175cd3".
 * The chat opens in an iframe from the platform: nothing of the site is read, and the site's styles do not affect it.
 */
(function () {
  var s = document.currentScript;
  if (!s || window.__growliftChat) return;
  var chave = s.getAttribute('data-chave') || '';
  if (!/^pk_[A-Za-z0-9_-]{8,64}$/.test(chave)) return;
  window.__growliftChat = true;
  var base = new URL(s.src).origin;
  var cor = /^#[0-9a-fA-F]{3,8}$/.test(s.getAttribute('data-cor') || '') ? s.getAttribute('data-cor') : '#175cd3';
  var texto = (s.getAttribute('data-texto') || 'Tirar dúvidas no chat').slice(0, 40);
  var quadro = null;

  function pequeno() { return window.matchMedia('(max-width: 480px)').matches; }
  function posicionar() {
    if (!quadro) return;
    var c = pequeno()
      ? 'right:0;bottom:0;width:100vw;height:100dvh;border-radius:0;'
      : 'right:16px;bottom:16px;width:min(92vw,380px);height:min(80vh,600px);border-radius:16px;';
    quadro.style.cssText = 'position:fixed;z-index:2147483646;border:0;background:#fff;box-shadow:0 12px 40px rgba(16,24,40,.25);' + c + (quadro.dataset.aberto === '1' ? '' : 'display:none;');
  }
  function abrir() {
    if (!quadro) {
      quadro = document.createElement('iframe');
      quadro.src = base + '/incorporar/' + encodeURIComponent(chave) + '/chat';
      quadro.title = 'Chat de atendimento';
      quadro.setAttribute('allow', 'clipboard-write');
      document.body.appendChild(quadro);
    }
    quadro.dataset.aberto = '1';
    posicionar();
    botao.style.display = 'none';
  }
  function fechar() {
    if (quadro) { quadro.dataset.aberto = '0'; posicionar(); }
    botao.style.display = '';
    botao.focus();
  }

  var botao = document.createElement('button');
  botao.type = 'button';
  botao.textContent = texto;
  botao.setAttribute('aria-label', texto);
  botao.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483646;min-height:48px;padding:12px 20px;border:0;border-radius:999px;background:' + cor + ';color:#fff;font:600 16px/1.2 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 8px 24px rgba(16,24,40,.25);cursor:pointer;';
  botao.addEventListener('click', abrir);
  window.addEventListener('resize', posicionar);
  window.addEventListener('message', function (e) {
    if (e.origin === base && e.data && e.data.growlift === 'fechar') fechar();
  });
  function montar() { document.body.appendChild(botao); }
  if (document.body) montar(); else document.addEventListener('DOMContentLoaded', montar);
})();
