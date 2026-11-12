'use client';

import { useEffect, useState } from 'react';
import { desligarAvisosAcao, ligarAvisosAcao, testarAvisoAcao } from '@/app/acoes';

interface EventoInstalar extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Sistema = 'iphone' | 'android' | 'outro';

function chaveEmBytes(base64: string): Uint8Array<ArrayBuffer> {
  const b = atob((base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(new ArrayBuffer(b.length));
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}

function nomeDoAparelho(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) return 'Android';
  if (/Mac OS X/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows';
  return 'Navegador';
}

/** Install instructions and the phone-alerts switch of the installed panel. */
export function AppCelular({ chavePublica, bloqueado }: { chavePublica: string | null; bloqueado: string | null }) {
  const [sistema, setSistema] = useState<Sistema>('outro');
  const [instalado, setInstalado] = useState(false);
  const [suporta, setSuporta] = useState<boolean | null>(null);
  const [inscricao, setInscricao] = useState<PushSubscription | null>(null);
  const [instalar, setInstalar] = useState<EventoInstalar | null>(null);
  const [msg, setMsg] = useState<{ ok?: string; erro?: string }>({});
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    // Reading the browser only exists after mounting; these values never change while the page is open.
    /* eslint-disable react-hooks/set-state-in-effect */
    setSistema(/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'iphone' : /Android/.test(ua) ? 'android' : 'outro');
    setInstalado(window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    const temPush = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setSuporta(temPush);
    /* eslint-enable react-hooks/set-state-in-effect */
    if (temPush) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then((r) => r.pushManager.getSubscription())
        .then(setInscricao)
        .catch(() => setSuporta(false));
    }
    const aoOferecer = (e: Event) => {
      e.preventDefault();
      setInstalar(e as EventoInstalar);
    };
    const aoInstalar = () => {
      setInstalado(true);
      setInstalar(null);
    };
    window.addEventListener('beforeinstallprompt', aoOferecer);
    window.addEventListener('appinstalled', aoInstalar);
    return () => {
      window.removeEventListener('beforeinstallprompt', aoOferecer);
      window.removeEventListener('appinstalled', aoInstalar);
    };
  }, []);

  async function ligar() {
    if (!chavePublica) return;
    setOcupado(true);
    setMsg({});
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== 'granted') {
        setMsg({ erro: 'O celular não deixou mandar avisos. Libere as notificações deste app nos ajustes do celular e tente de novo.' });
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveEmBytes(chavePublica) }));
      const r = await ligarAvisosAcao(JSON.parse(JSON.stringify(sub)), nomeDoAparelho());
      if (r.erro) {
        await sub.unsubscribe().catch(() => {});
        setMsg(r);
        return;
      }
      setInscricao(sub);
      setMsg(r);
    } catch {
      setMsg({ erro: 'Não foi possível ligar os avisos neste aparelho agora. Tente de novo em instantes.' });
    } finally {
      setOcupado(false);
    }
  }

  async function desligar() {
    if (!inscricao) return;
    setOcupado(true);
    const endpoint = inscricao.endpoint;
    await inscricao.unsubscribe().catch(() => {});
    setInscricao(null);
    setMsg(await desligarAvisosAcao(endpoint));
    setOcupado(false);
  }

  async function testar() {
    setOcupado(true);
    setMsg(await testarAvisoAcao());
    setOcupado(false);
  }

  const passoInstalar = instalado ? (
    <p className="text-ok">Pronto: você está usando o app instalado.</p>
  ) : sistema === 'iphone' ? (
    <ol className="list-decimal space-y-1 pl-5">
      <li>Abra este endereço no <strong>Safari</strong>.</li>
      <li>Toque no botão <strong>Compartilhar</strong> (o quadrado com a seta para cima).</li>
      <li>Toque em <strong>Adicionar à Tela de Início</strong> e depois em <strong>Adicionar</strong>.</li>
      <li>Abra o app pelo ícone <strong>Growlift</strong> e volte nesta tela para ligar os avisos.</li>
    </ol>
  ) : instalar ? (
    <button
      type="button"
      className="botao"
      onClick={async () => {
        await instalar.prompt();
        await instalar.userChoice.catch(() => null);
        setInstalar(null);
      }}
    >
      Instalar o app
    </button>
  ) : (
    <ol className="list-decimal space-y-1 pl-5">
      <li>Abra este endereço no <strong>Chrome</strong>.</li>
      <li>Toque no menu <strong>⋮</strong> (três pontinhos) e em <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.</li>
      <li>Abra o app pelo ícone <strong>Growlift</strong>.</li>
    </ol>
  );

  const precisaInstalarAntes = sistema === 'iphone' && !instalado;

  return (
    <>
      <section className="cartao space-y-3 p-5">
        <h2 className="text-lg font-bold">1. Instalar no celular</h2>
        <div className="text-[15px]">{passoInstalar}</div>
      </section>

      <section className="cartao space-y-3 p-5">
        <h2 className="text-lg font-bold">2. Ligar os avisos</h2>
        {bloqueado ? (
          <p className="text-suave">{bloqueado}</p>
        ) : !chavePublica ? (
          <p className="text-suave">Os avisos ainda não estão configurados neste servidor. Fale com a equipe Growlift.</p>
        ) : suporta === null ? (
          <p className="text-suave">Verificando este aparelho…</p>
        ) : precisaInstalarAntes ? (
          <p className="text-[15px]">No iPhone, os avisos só funcionam no app instalado (iOS 16.4 ou mais novo). Faça o passo 1 e abra pelo ícone.</p>
        ) : !suporta ? (
          <p className="text-[15px]">Este navegador não aceita avisos. No Android, use o Chrome; no iPhone, o app instalado pelo Safari.</p>
        ) : inscricao ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="etiqueta bg-ok-clara text-ok">Avisos ligados neste aparelho</span>
            <button type="button" className="botao" disabled={ocupado} onClick={testar}>Mandar aviso de teste</button>
            <button type="button" className="botao-2" disabled={ocupado} onClick={desligar}>Desligar</button>
          </div>
        ) : (
          <button type="button" className="botao" disabled={ocupado} onClick={ligar}>{ocupado ? 'Ligando…' : 'Ligar avisos neste celular'}</button>
        )}
        {msg.erro && <p role="alert" className="aviso bg-erro-clara text-erro">{msg.erro}</p>}
        {msg.ok && <p role="status" className="aviso bg-ok-clara text-ok">{msg.ok}</p>}
      </section>
    </>
  );
}
