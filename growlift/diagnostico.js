// Diagnóstico para empresas de conserto (diagnostico.html): dono? → ramo e dores → 5 sugestões → contato.
// Só entra aqui o que o sistema da Growlift já faz (ver comercial/README.md). Nada de resultado ou prazo novo.
(() => {
  const form = document.getElementById('lp-form');
  if (!form) return;

  const SOLUCOES = {
    ligacao: ['Ligação perdida vira conversa', 'Quem liga e ninguém atende ouve um aviso e, se apertar 1, recebe uma mensagem no WhatsApp. Você ganha a tarefa de retornar. Precisa de um número de telefonia pela internet, e o plano mostra o custo.'],
    ia: ['Atendente de IA no WhatsApp', 'Responde de dia e de noite com os seus preços e horários, entende áudio, faz orçamento e chama você quando precisa.'],
    aviso: ['Aviso no seu celular', 'Cada pedido novo avisa no seu celular, com o que o cliente precisa, se você ligar os avisos.'],
    agenda: ['Agenda de visitas com lembrete', 'Mostra os horários livres, marca a visita e lembra o cliente na véspera, se ele aceitou receber.'],
    retomada: ['Retomada de orçamento', 'Mandou o orçamento e o cliente sumiu? Sai uma retomada para quem autorizou, e ela para quando ele responde.'],
    proposta: ['Orçamento online com aceite', 'O cliente abre o orçamento pelo link e aceita na hora. Você vê quando ele abriu.'],
    avaliacao: ['Avaliações no Google', 'Depois do serviço, o convite para avaliar vai para os clientes que aceitaram receber, sem escolher quem gostou.'],
    manutencao: ['Lembrete de manutenção', 'Meses depois do serviço, lembra o cliente que aceitou de fazer a manutenção.'],
    site: ['Site com chat', 'Um site da sua empresa em que o cliente tira dúvida no chat e pede orçamento.'],
    vendas: ['Relatório do que foi pago', 'Cada pedido acompanhado até o pagamento, e o relatório do que entrou.'],
  };
  // Para cada dor, as soluções em ordem de importância (3, 2 e 1 ponto).
  const POR_DOR = {
    ligacao: ['ligacao', 'aviso', 'ia'],
    demora: ['ia', 'aviso', 'agenda'],
    noite: ['ia', 'agenda', 'ligacao'],
    orcamento: ['retomada', 'proposta', 'vendas'],
    agenda: ['agenda', 'aviso', 'ia'],
    volta: ['manutencao', 'avaliacao', 'retomada'],
    google: ['avaliacao', 'site', 'ia'],
    controle: ['vendas', 'proposta', 'aviso'],
  };
  const ORDEM = ['ligacao', 'ia', 'aviso', 'agenda', 'retomada', 'avaliacao', 'manutencao', 'proposta', 'site', 'vendas'];
  const NOME_DOR = Object.fromEntries(Array.from(form.querySelectorAll('input[name=dor]'), (i) => [i.value, i.nextElementSibling.textContent]));

  const steps = Array.from(form.querySelectorAll('.wstep'));
  const msg = document.getElementById('lp-msg');
  const count = document.getElementById('lp-count');
  const bar = document.getElementById('lp-bar');
  const outro = document.getElementById('lp-outro');
  const outroInput = document.getElementById('f-outro');
  const lista = document.getElementById('lp-sol');
  const button = form.querySelector('button[type=submit]');
  const picked = (name) => Array.from(form.querySelectorAll(`input[name=${name}]:checked`), (i) => i.value);

  const fail = (text, field) => {
    msg.textContent = text;
    msg.className = 'form-msg bad';
    msg.hidden = false;
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
    return false;
  };
  const clear = () => { msg.hidden = true; };

  let current = 0;
  const go = (n) => {
    current = n;
    steps.forEach((s, i) => (s.hidden = i !== n));
    count.textContent = `Passo ${n + 1} de ${steps.length}`;
    bar.style.transform = `scaleX(${(n + 1) / steps.length})`;
    clear();
    const top = form.getBoundingClientRect().top;
    if (top < 70) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    steps[n].querySelector('input:not([type=hidden])')?.focus({ preventScroll: true });
  };
  form.classList.add('steps-on');

  const ramo = () => {
    const r = picked('ramo')[0] || '';
    return (r === 'Outro' ? outroInput.value.trim() || 'Outro' : r).slice(0, 60);
  };

  const sugerir = () => {
    const pontos = Object.fromEntries(ORDEM.map((k) => [k, 0]));
    picked('dor').forEach((d) => (POR_DOR[d] || []).forEach((k, i) => (pontos[k] += 3 - i)));
    return ORDEM.slice().sort((a, b) => pontos[b] - pontos[a] || ORDEM.indexOf(a) - ORDEM.indexOf(b)).slice(0, 5);
  };
  const montar = () => {
    const antes = new Set(picked('quer'));
    lista.replaceChildren(
      ...sugerir().map((k) => {
        const label = document.createElement('label');
        label.className = 'opt';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.name = 'quer';
        input.value = k;
        input.checked = antes.has(k);
        const span = document.createElement('span');
        const b = document.createElement('b');
        b.textContent = SOLUCOES[k][0];
        const small = document.createElement('small');
        small.textContent = SOLUCOES[k][1];
        span.append(b, small);
        label.append(input, span);
        return label;
      }),
    );
  };

  const valid = (n) => {
    if (n === 0) {
      const d = picked('dono')[0];
      if (!d) return fail('Escolha uma das opções.', form.querySelector('input[name=dono]'));
      if (d === 'nao') {
        form.hidden = true;
        const nao = document.getElementById('lp-nao');
        nao.hidden = false;
        nao.focus();
        return false;
      }
    }
    if (n === 1) {
      const r = picked('ramo')[0];
      if (!r) return fail('Escolha o serviço da empresa.', form.querySelector('input[name=ramo]'));
      if (r === 'Outro' && outroInput.value.trim().length < 2) return fail('Conte qual é o serviço.', outroInput);
      if (!picked('dor').length) return fail('Marque pelo menos uma coisa que atrapalha hoje.', form.querySelector('input[name=dor]'));
    }
    if (n === 2 && !picked('quer').length) return fail('Marque pelo menos uma das sugestões.', lista.querySelector('input'));
    return true;
  };

  form.querySelectorAll('[data-next]').forEach((b) =>
    b.addEventListener('click', () => {
      if (!valid(current)) return;
      if (current === 1) montar();
      go(current + 1);
    }),
  );
  form.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => go(current - 1)));
  form.addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'ramo') {
      outro.hidden = t.value !== 'Outro';
      if (!outro.hidden) outroInput.focus();
    }
    if (t.name === 'dor' && t.checked && picked('dor').length > 3) {
      t.checked = false;
      fail('Marque até 3: as que mais pesam hoje.');
    } else if (t.name === 'dor') clear();
  });

  // Mesmo envio do formulário da página principal (main.js): painel antigo + sistema, sem mensagem automática.
  const idem = `lp-${window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)}`;
  const campaign = () => {
    const p = new URLSearchParams(location.search);
    return Object.fromEntries(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'].filter((k) => p.get(k)).map((k) => [k, p.get(k).slice(0, 120)]));
  };
  const post = (url, body) =>
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) }).then(async (res) => {
      const b = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(b.error || b.erro || 'Não foi possível enviar agora. Tente de novo em instantes.');
      return b;
    });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    for (let i = 0; i < 3; i++) if (!valid(i)) return go(i);
    const f = form.elements;
    const digits = f.whatsapp.value.replace(/\D/g, '');
    if (f.business.value.trim().length < 2) return fail('Informe o nome da empresa.', f.business);
    if (digits.length < 10) return fail('Informe um WhatsApp com DDD.', f.whatsapp);
    if (f.city.value.trim().length < 2) return fail('Informe a cidade da empresa.', f.city);
    if (!f.consent.checked) return fail('Marque a autorização para podermos mandar o plano no WhatsApp.', f.consent);

    clear();
    button.disabled = true;
    button.textContent = 'Enviando…';
    const dores = picked('dor').map((d) => NOME_DOR[d]);
    const quer = picked('quer').map((k) => SOLUCOES[k][0]);
    const conte = f.wishes.value.trim().slice(0, 500);
    const texto = [`Página para empresas de conserto`, `Maior dor: ${dores.join('; ')}`, `Ramo: ${ramo()}`, `Quer: ${quer.join('; ')}`, conte ? `Contou: ${conte}` : ''].filter(Boolean).join('\n');
    const sent = await Promise.allSettled([
      post(form.dataset.endpoint, {
        business: f.business.value,
        segment: ramo(),
        city: f.city.value.trim(),
        whatsapp: digits,
        presence: f.presence.value,
        wishes: texto.slice(0, 1000),
        consent: true,
        website: f.website.value,
      }),
      post(form.dataset.sistema, {
        chave: form.dataset.chave,
        nome: f.business.value.trim(),
        telefone: digits,
        cidade: f.city.value.trim(),
        necessidade: `Pediu o diagnóstico pela página para empresas de conserto.\nQuer: ${quer.join('; ')}${conte ? `\nContou: ${conte}` : ''}`.slice(0, 1000),
        preferencia_contato: 'WhatsApp',
        aceite_whatsapp: false,
        chave_idempotencia: idem,
        extras: { ramo: ramo(), dor: dores.join('; ').slice(0, 200), presenca: f.presence.value.trim().slice(0, 200) },
        campanha: campaign(),
        site_url: f.website.value,
      }),
    ]);
    if (sent.some((r) => r.status === 'fulfilled')) {
      form.hidden = true;
      const ok = document.getElementById('lp-ok');
      ok.hidden = false;
      ok.focus();
      return;
    }
    const err = sent[0].reason;
    const offline = err instanceof TypeError || (err && err.name === 'TimeoutError');
    fail(offline ? 'Sem conexão. Confira a internet e tente de novo.' : err.message);
    button.disabled = false;
    button.textContent = 'Receber meu plano grátis';
  });
})();
