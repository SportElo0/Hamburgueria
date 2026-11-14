'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

// Chrome/Edge/Android fire this before offering to install; Safari never does.
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// iPhone, and iPad (which reports itself as a Mac but has a touch screen).
function isIOS() {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function Logo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id="gl-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2b7bff" />
          <stop offset="1" stopColor="#0652d1" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#gl-logo)" />
      <g transform="translate(12.5 17.5) scale(0.0736)">
        <path fill="#fff" d="M280 48H410L190 450H55Z" transform="translate(-50 -40)" />
        <path fill="#fff" fillRule="evenodd" d="M470 130L570 450H258Z M418 220L480 380H309Z" transform="translate(-50 -40)" />
      </g>
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="inline-block align-[-3px]">
      <path d="M12 3v12" />
      <path d="m8 7 4-4 4 4" />
      <path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" />
    </svg>
  );
}

const noSubscribe = () => () => {};
const iosSnapshot = () => isIOS() && !isStandalone();

export function InstallButton() {
  // iPhone needs the step-by-step sheet; read on the client only (false on the server).
  const ios = useSyncExternalStore(noSubscribe, iosSnapshot, () => false);
  const [canPrompt, setCanPrompt] = useState(false);
  const mode: 'hidden' | 'prompt' | 'ios' = ios ? 'ios' : canPrompt ? 'prompt' : 'hidden';
  const promptRef = useRef<InstallPromptEvent | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isStandalone() || isIOS()) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      promptRef.current = e as InstallPromptEvent;
      setCanPrompt(true);
    };
    const onInstalled = () => {
      promptRef.current = null;
      setCanPrompt(false);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (mode === 'hidden') return null;

  async function onClick() {
    if (mode === 'ios') {
      dialogRef.current?.showModal();
      return;
    }
    const ev = promptRef.current;
    if (!ev) return;
    await ev.prompt();
    await ev.userChoice;
    // The browser only lets each event be used once.
    promptRef.current = null;
    setCanPrompt(false);
  }

  return (
    <>
      <button type="button" onClick={onClick} className="btn-ghost min-h-9 gap-2 px-3">
        <Logo />
        <span className="sm:hidden">Instalar</span>
        <span className="hidden sm:inline">Adicionar à tela inicial</span>
      </button>

      {mode === 'ios' && (
        <dialog
          ref={dialogRef}
          aria-labelledby="instalar-titulo"
          className="m-auto w-[min(24rem,calc(100vw-2rem))] rounded-2xl p-0 backdrop:bg-ink/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) e.currentTarget.close();
          }}
        >
          <div className="p-6 text-center">
            <div className="mx-auto w-max rounded-[22px] shadow-[0_18px_40px_-16px_rgba(8,101,254,.7)]">
              <Logo size={76} />
            </div>
            <h2 id="instalar-titulo" className="mt-4 text-lg font-bold">
              Painel na tela inicial
            </h2>
            <p className="mt-1 text-sm text-ink-mute">Abre como um app, com o ícone da Growlift.</p>
            <ol className="mt-5 space-y-3 text-left text-[15px]">
              <li className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-bold text-accent">1</span>
                <span>
                  Toque em <strong>Compartilhar</strong> <ShareIcon /> na barra do navegador.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-bold text-accent">2</span>
                <span>
                  Desça e toque em <strong>Adicionar à Tela de Início</strong>.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-bold text-accent">3</span>
                <span>
                  Toque em <strong>Adicionar</strong>. Pronto!
                </span>
              </li>
            </ol>
            <form method="dialog" className="mt-6">
              <button type="submit" className="btn-primary min-h-11 w-full" autoFocus>
                Entendi
              </button>
            </form>
          </div>
        </dialog>
      )}
    </>
  );
}
