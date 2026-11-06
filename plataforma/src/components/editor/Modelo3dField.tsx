'use client';

import { useEffect, useRef, useState } from 'react';
import type { Item } from '@/lib/schema';
import { contagem3dAction, uploadModelo3dAction } from '@/app/painel/actions';
import { Prato3D } from '@/components/mesa/Prato3D';
import { mediaSrc } from './CatalogEditor';

type Preparado = { bytes: Uint8Array; triangulos: number; trianguloAntes: number; sugestaoCm: number | null; nome: string };

const mb = (n: number) => `${(n / 1048576).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`;
const mil = (n: number) => (n >= 1000 ? `${Math.round(n / 1000).toLocaleString('pt-BR')} mil` : String(n));
const cm = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} cm`;

/**
 * Growlift team only: the dish in 3D for the table menu. The scan is lightened here in the browser, then the
 * server scales it to the real width typed below (measured with a ruler) and stores the measured sizes.
 */
export function Modelo3dField({ item, slug, change }: { item: Item; slug: string; change: (fn: (i: Item) => void) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [fase, setFase] = useState<'parado' | 'preparando' | 'enviando'>('parado');
  const [erro, setErro] = useState('');
  const [preparado, setPreparado] = useState<Preparado | null>(null);
  const [largura, setLargura] = useState('');
  const [medi, setMedi] = useState(false);
  const [origem, setOrigem] = useState<'equipe' | 'dono' | ''>('');
  const [previa, setPrevia] = useState(false);
  const [vistas, setVistas] = useState<{ tela: number; mesa: number } | null>(null);
  const modelo = item.modelo3d ?? null;
  const base = `m3d-${item.id}`;

  useEffect(() => {
    if (!modelo) return;
    let vivo = true;
    contagem3dAction(slug, [item.id])
      .then((r) => vivo && setVistas(r[item.id] ?? null))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [slug, item.id, modelo]);

  const escolher = async (file: File) => {
    setErro('');
    setPreparado(null);
    setMedi(false);
    setFase('preparando');
    try {
      const { prepararNoNavegador } = await import('@/lib/modelo3d-navegador');
      const r = await prepararNoNavegador(file);
      setPreparado({ ...r, nome: file.name });
      setLargura(r.sugestaoCm ? String(r.sugestaoCm).replace('.', ',') : '');
    } catch (err) {
      setErro(err instanceof Error && err.message ? err.message : 'Não deu para abrir o arquivo 3D.');
    } finally {
      setFase('parado');
    }
  };

  const larguraCm = Number(largura.replace(',', '.'));
  const larguraOk = Number.isFinite(larguraCm) && larguraCm >= 3 && larguraCm <= 100;

  const salvar = async () => {
    if (!preparado || !larguraOk || !medi || !origem) return;
    setErro('');
    setFase('enviando');
    const fd = new FormData();
    fd.set('arquivo', new File([preparado.bytes as BlobPart], 'prato.glb', { type: 'model/gltf-binary' }));
    fd.set('larguraCm', String(larguraCm));
    fd.set('origemMedida', origem);
    try {
      const res = await uploadModelo3dAction(slug, fd);
      if (!res.ok || !res.modelo) return setErro(res.error ?? 'Falha no envio.');
      const novo = res.modelo;
      change((i) => void (i.modelo3d = novo));
      setPreparado(null);
      setLargura('');
      setMedi(false);
      setOrigem('');
    } catch {
      setErro('Falha no envio. Confira a internet e tente de novo.');
    } finally {
      setFase('parado');
    }
  };

  return (
    <div className="rounded-lg border border-line bg-white p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Prato em 3D (tamanho real)</p>
          <p className="text-xs text-ink-mute">Aparece só no cardápio da mesa, com o selo 3D e o botão “Ver na minha mesa”. Só a Growlift envia.</p>
        </div>
        <button type="button" className="btn-ghost min-h-9 px-3" disabled={fase !== 'parado'} onClick={() => input.current?.click()}>
          {fase === 'preparando' ? 'Preparando…' : modelo ? 'Trocar 3D' : 'Enviar 3D (.glb)'}
        </button>
        <input
          ref={input}
          type="file"
          accept=".glb,model/gltf-binary"
          className="sr-only"
          aria-label="Escolher arquivo 3D"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void escolher(f);
            e.target.value = '';
          }}
        />
      </div>

      {modelo && !preparado && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-paper p-3 text-sm">
          <span className="font-semibold tabular-nums">
            {cm(modelo.larguraCm)} de largura · {cm(modelo.alturaCm)} de altura
          </span>
          {modelo.medidoEm && (
            <span className="text-xs text-ink-mute">
              Enviado por {modelo.medidoPor || 'equipe'} em {new Date(modelo.medidoEm).toLocaleDateString('pt-BR')} · medido {modelo.origemMedida === 'dono' ? 'pelo dono (vídeo)' : 'pela Growlift'}
            </span>
          )}
          {vistas && (
            <span className="text-xs text-ink-mute tabular-nums">
              Este mês: aberto {vistas.tela}× no 3D, {vistas.mesa}× na mesa
            </span>
          )}
          <span className="ml-auto flex gap-2">
            <button type="button" className="btn-ghost min-h-9 px-3" onClick={() => setPrevia(true)}>
              Ver prévia
            </button>
            <button type="button" className="btn-danger min-h-9 px-3" onClick={() => change((i) => void (i.modelo3d = null))}>
              Remover
            </button>
          </span>
        </div>
      )}

      {preparado && (
        <div className="mt-3 grid gap-3 rounded-lg bg-paper p-3">
          <p className="text-sm">
            <strong>{preparado.nome}</strong> pronto: {mb(preparado.bytes.byteLength)}
            {preparado.trianguloAntes > preparado.triangulos ? `, detalhe reduzido de ${mil(preparado.trianguloAntes)} para ${mil(preparado.triangulos)} triângulos` : ''}.
          </p>
          <div className="grid gap-3 sm:grid-cols-[10rem_1fr] sm:items-start">
            <div>
              <label htmlFor={`${base}-largura`} className="label">Largura real (cm)</label>
              <input
                id={`${base}-largura`}
                inputMode="decimal"
                placeholder="Ex.: 18"
                className={`field tabular-nums ${largura && !larguraOk ? 'border-bad' : ''}`}
                value={largura}
                aria-invalid={Boolean(largura) && !larguraOk}
                aria-describedby={`${base}-ajuda`}
                onChange={(e) => setLargura(e.target.value)}
              />
            </div>
            <p id={`${base}-ajuda`} className="text-xs leading-relaxed text-ink-mute sm:pt-6">
              Meça com régua a <strong>maior medida vista de cima</strong> de tudo que aparece no 3D (com o prato, se ele foi escaneado junto).
              {preparado.sugestaoCm ? ` O arquivo diz ${cm(preparado.sugestaoCm)}: confira com a régua antes de salvar.` : ' Este arquivo não traz a medida (escaneado por vídeo): a régua decide o tamanho.'}
            </p>
          </div>
          <fieldset>
            <legend className="label">Quem mediu com a régua?</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="radio" name={`${base}-origem`} className="h-4 w-4 accent-accent" checked={origem === 'equipe'} onChange={() => setOrigem('equipe')} />
                A Growlift, no restaurante
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="radio" name={`${base}-origem`} className="h-4 w-4 accent-accent" checked={origem === 'dono'} onChange={() => setOrigem('dono')} />
                O dono, que mandou vídeo e foto da régua
              </label>
            </div>
          </fieldset>
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-accent" checked={medi} onChange={(e) => setMedi(e.target.checked)} />
            <span>
              Confirmo que o 3D é deste prato, na porção servida hoje no restaurante, e que a largura de {larguraOk ? cm(larguraCm) : '___ cm'} foi medida com régua no prato de verdade. Guardei a foto ou o vídeo da régua.
            </span>
          </label>
          <div className="flex gap-2">
            <button type="button" className="btn-primary min-h-10 px-4" disabled={!larguraOk || !medi || !origem || fase !== 'parado'} onClick={salvar}>
              {fase === 'enviando' ? 'Salvando…' : 'Salvar 3D'}
            </button>
            <button type="button" className="btn-ghost min-h-10 px-4" disabled={fase !== 'parado'} onClick={() => setPreparado(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {erro && <p role="alert" className="mt-2 text-xs font-semibold text-bad">{erro}</p>}
      {modelo && !preparado && <p className="mt-2 text-xs text-ink-mute">Depois de enviar ou remover, salve e publique a loja para mudar na mesa.</p>}

      {previa && modelo && (
        <Prato3D
          item={{ id: item.id, name: item.name || 'Prato', image: item.image ? mediaSrc(item.image) : '', imageAlt: item.imageAlt, modelo3d: { src: mediaSrc(modelo.src), larguraCm: modelo.larguraCm, alturaCm: modelo.alturaCm } }}
          onClose={() => setPrevia(false)}
          onVer={() => {}}
        />
      )}
    </div>
  );
}
