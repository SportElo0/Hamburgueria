'use client';

import { useEffect, useRef, useState } from 'react';
import type { ModelViewerElement } from '@google/model-viewer';

export interface Prato3DItem {
  id: string;
  name: string;
  image: string;
  imageAlt: string;
  modelo3d: { src: string; larguraCm: number; alturaCm: number };
}

const cm = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} cm`;

export function Cubo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M12 2.8 20.5 7.5v9L12 21.2 3.5 16.5v-9L12 2.8Z" />
      <path d="M3.8 7.6 12 12.2l8.2-4.6M12 12.2v8.8" />
    </svg>
  );
}

function Camera({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.4-2h5.8l1.4 2h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-9Z" />
      <circle cx="12" cy="13" r="3.4" />
    </svg>
  );
}

/** The little "3D" mark on a dish's photo in the menu list. */
export function Selo3D() {
  return (
    <span className="pointer-events-none absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-[#121826]/85 px-2 py-0.5 text-[11px] font-black tracking-wide text-[#FFFFFF]">
      <Cubo className="h-3 w-3" />
      3D
    </span>
  );
}

/**
 * A dish in 3D at real size. On the screen it turns with a finger; "Ver na minha mesa" opens the phone's own
 * AR (iPhone: Quick Look; Android: Scene Viewer or WebXR) with the size locked, so it can't be pinched bigger.
 * The file is already scaled to the dish's real width on upload. The viewer library loads only when this opens.
 */
/** `exemplo`: the demo menu's code-made burger, which is no dish served anywhere: the notice says so. */
export function Prato3D({ item, onClose, onVer, exemplo = false }: { item: Prato3DItem; onClose: () => void; onVer: (modo: 'tela' | 'mesa') => void; exemplo?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const viewer = useRef<ModelViewerElement | null>(null);
  const fechar = useRef<HTMLButtonElement>(null);
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'erro'>('carregando');
  const [podeAR, setPodeAR] = useState(false);
  const [arFalhou, setArFalhou] = useState(false);
  const onVerRef = useRef(onVer);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onVerRef.current = onVer;
    onCloseRef.current = onClose;
  });

  const { src } = item.modelo3d;
  const alt = `${item.name} em 3D`;
  const poster = item.image;

  useEffect(() => {
    onVerRef.current('tela');
  }, [item.id]);

  useEffect(() => {
    let gone = false;
    let el: ModelViewerElement | null = null;
    import('@google/model-viewer')
      .then(() => {
        if (gone || !box.current) return;
        el = document.createElement('model-viewer') as ModelViewerElement;
        const calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const attrs: Record<string, string> = {
          src,
          alt,
          'camera-controls': '',
          'touch-action': 'pan-y',
          'interaction-prompt': 'none',
          'camera-orbit': '30deg 62deg auto',
          'shadow-intensity': '1',
          'shadow-softness': '0.9',
          'environment-image': 'neutral',
          exposure: '1.05',
          ar: '',
          'ar-modes': 'webxr scene-viewer quick-look',
          // Real size: no pinching it bigger or smaller on the table.
          'ar-scale': 'fixed',
          'ar-placement': 'floor',
          'ar-usdz-max-texture-size': '1024',
        };
        if (poster) attrs.poster = poster;
        if (!calmo) Object.assign(attrs, { 'auto-rotate': '', 'auto-rotate-delay': '600', 'rotation-per-second': '16deg' });
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
        el.style.cssText = 'width:100%;height:100%;background:transparent;--poster-color:transparent;--progress-bar-color:#0865FE';
        // Our own button opens AR; the library's corner button would be a second, smaller one.
        const semBotao = document.createElement('span');
        semBotao.slot = 'ar-button';
        semBotao.hidden = true;
        el.appendChild(semBotao);
        el.addEventListener('load', () => {
          setEstado('pronto');
          setPodeAR(Boolean(el?.canActivateAR));
        });
        el.addEventListener('error', () => setEstado('erro'));
        el.addEventListener('ar-status', (e) => {
          if ((e as CustomEvent<{ status: string }>).detail.status === 'failed') setArFalhou(true);
        });
        box.current.appendChild(el);
        viewer.current = el;
        requestAnimationFrame(() => !gone && setPodeAR(Boolean(el?.canActivateAR)));
      })
      .catch(() => !gone && setEstado('erro'));
    return () => {
      gone = true;
      el?.remove();
      viewer.current = null;
    };
  }, [src, alt, poster]);

  useEffect(() => {
    const antes = document.activeElement as HTMLElement | null;
    fechar.current?.focus();
    // Capture: opened over the dish's options sheet, Escape closes only this one.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      onCloseRef.current();
    };
    window.addEventListener('keydown', onKey, true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prev;
      antes?.focus?.();
    };
  }, []);

  const verNaMesa = async () => {
    setArFalhou(false);
    onVer('mesa');
    try {
      await viewer.current?.activateAR();
    } catch {
      setArFalhou(true);
    }
  };

  return (
    <div className="prato3d-fundo fixed inset-0 z-50 flex items-end bg-black/60" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={alt} className="prato3d-folha flex h-[92dvh] w-full flex-col rounded-t-[28px] bg-[#FFFFFF]">
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[12px] font-bold tracking-[0.12em] text-[#0865FE] uppercase">
              <Cubo className="h-3.5 w-3.5" />
              Tamanho do prato
            </p>
            <h2 className="truncate text-xl font-extrabold">{item.name}</h2>
          </div>
          <button ref={fechar} type="button" onClick={onClose} aria-label="Fechar" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#DCE2EC] text-xl">
            ×
          </button>
        </div>

        <div className="relative mx-4 min-h-0 flex-1 overflow-hidden rounded-[24px] bg-[radial-gradient(120%_90%_at_50%_30%,#FFFFFF_0%,#EEF2F8_60%,#E3E9F2_100%)]">
          <div ref={box} className="absolute inset-0" />
          {estado === 'carregando' && (
            <p role="status" className="absolute inset-x-0 bottom-4 mx-auto w-max rounded-full bg-[#FFFFFF]/90 px-4 py-2 text-sm font-semibold text-[#4A5568] shadow-sm">
              Carregando o prato…
            </p>
          )}
          {estado === 'erro' && (
            <p role="alert" className="absolute inset-x-6 top-1/2 -translate-y-1/2 text-center text-[15px] text-[#4A5568]">
              Não deu para abrir o 3D agora. Tente de novo daqui a pouco.
            </p>
          )}
          <p className="pointer-events-none absolute top-3 left-3 rounded-full bg-[#FFFFFF]/90 px-3 py-1 text-[13px] font-bold text-[#121826] tabular-nums shadow-sm">
            {cm(item.modelo3d.larguraCm)} de largura
            {item.modelo3d.alturaCm >= 1 ? ` · ${cm(item.modelo3d.alturaCm)} de altura` : ''}
          </p>
        </div>

        <div className="px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
          <p className="mb-3 text-center text-[14px] leading-snug text-[#4A5568]">
            {exemplo
              ? `Exemplo para demonstração: 3D feito em computador, não é um prato de verdade. Tem ${cm(item.modelo3d.larguraCm)} na parte mais larga, com o prato. O tamanho no celular é aproximado.`
              : `3D feito a partir do prato servido aqui, com ${cm(item.modelo3d.larguraCm)} na parte mais larga (com a louça, se ela aparece). O tamanho no celular é aproximado e a montagem pode variar um pouco de um prato para outro.`}
          </p>
          {podeAR ? (
            <>
              <button
                type="button"
                onClick={verNaMesa}
                disabled={estado !== 'pronto'}
                className="flex min-h-14 w-full items-center justify-center gap-2.5 rounded-full bg-[#0865FE] px-6 text-[16px] font-extrabold text-[#FFFFFF] disabled:opacity-60"
              >
                <Camera className="h-5 w-5" />
                Ver na minha mesa
              </button>
              <p className="mt-2.5 text-center text-[13px] leading-snug text-[#4A5568]">
                {arFalhou
                  ? 'Não deu para abrir a câmera neste celular. Gire o prato aqui na tela.'
                  : 'Aponte a câmera para a mesa e mova o celular devagar. O prato aparece em tamanho aproximado ao real.'}
              </p>
            </>
          ) : (
            <p className="text-center text-[14px] leading-snug text-[#4A5568]">
              Gire o prato com o dedo. Para ver na mesa pela câmera, abra este cardápio num iPhone ou num Android.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
