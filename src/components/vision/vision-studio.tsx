"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  defaultChoice,
  describeChoice,
  finishOptions,
  interiorOptions,
  paintOptions,
  roofOptions,
  styleOptions,
  wheelOptions,
  type VisionChoice,
  type VisionOption,
} from "@/content/vision-options";
import { Comparator } from "../comparator";
import { ArrowRight, Download, Image as ImageIcon, Plus, Refresh, Sliders, Upload } from "../icons";
import { LeadForm } from "../lead-form";

type Status =
  | { loading: true }
  | { loading: false; available: true; remaining: number; perClient: number; maxMb: number }
  | { loading: false; available: false; message: string; maxMb: number };

type Phase = "upload" | "imagine" | "generating" | "result";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const EASE = [0.16, 1, 0.3, 1] as const;

/** Downscale on the device before upload: faster on mobile networks, under serverless body limits. */
async function prepareImage(file: File, maxSide = 2048): Promise<{ blob: Blob; url: string; w: number; h: number }> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", 0.9));
  return { blob, url: URL.createObjectURL(blob), w, h };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

async function shrinkDataUrl(src: string, maxSide: number): Promise<string> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * scale);
  c.height = Math.round(img.naturalHeight * scale);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.85);
}

export function VisionStudio({ initial }: { initial: Partial<VisionChoice> }) {
  const reduce = useReducedMotion();
  const [status, setStatus] = useState<Status>({ loading: true });
  const [phase, setPhase] = useState<Phase>("upload");
  const [photo, setPhoto] = useState<{ blob: Blob; url: string; w: number; h: number; name: string } | null>(null);
  const [choice, setChoice] = useState<VisionChoice>({ ...defaultChoice, ...initial });
  const [concept, setConcept] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ stage: "upload" | "generate"; pct: number; elapsed: number }>({ stage: "upload", pct: 0, elapsed: 0 });
  const [drag, setDrag] = useState(false);
  const [wantsEvaluation, setWantsEvaluation] = useState(false);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const r = await fetch("/api/vision", { cache: "no-store" });
      const d = await r.json();
      setStatus(d.available ? { loading: false, available: true, remaining: d.remaining, perClient: d.perClient, maxMb: d.maxMb } : { loading: false, available: false, message: d.message, maxMb: d.maxMb });
    } catch {
      setStatus({ loading: false, available: false, message: "Não foi possível verificar o serviço de IA agora.", maxMb: 8 });
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => () => (photo ? URL.revokeObjectURL(photo.url) : undefined), [photo]);

  const maxMb = status.loading ? 8 : status.maxMb;

  async function acceptFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!ACCEPT.includes(file.type)) return setError("Formato não aceito. Envie uma foto em JPG, PNG ou WEBP.");
    if (file.size > 25 * 1024 * 1024) return setError("Arquivo grande demais. Envie uma foto de até 25 MB.");
    try {
      const prepared = await prepareImage(file);
      if (prepared.blob.size > maxMb * 1024 * 1024) return setError(`Mesmo reduzida, a foto passou de ${maxMb} MB. Tente outra imagem.`);
      if (Math.min(prepared.w, prepared.h) < 320) return setError("A foto é pequena demais. Use uma imagem com pelo menos 320 px no menor lado.");
      setPhoto({ ...prepared, name: file.name });
      setConcept(null);
      setPhase("imagine");
    } catch {
      setError("Não foi possível abrir esta imagem. Tente outra foto.");
    }
  }

  function generate() {
    if (!photo || status.loading || !status.available) return;
    setError(null);
    setPhase("generating");
    setProgress({ stage: "upload", pct: 0, elapsed: 0 });
    const started = Date.now();
    const tick = setInterval(() => setProgress((p) => ({ ...p, elapsed: Math.round((Date.now() - started) / 1000) })), 1000);

    const fd = new FormData();
    fd.append("image", photo.blob, "carro.jpg");
    fd.append("choice", JSON.stringify(choice));
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("POST", "/api/vision");
    xhr.responseType = "json";
    xhr.timeout = 130_000;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress((p) => ({ ...p, pct: Math.round((e.loaded / e.total) * 100) }));
    };
    xhr.upload.onload = () => setProgress((p) => ({ ...p, stage: "generate", pct: 100 }));
    const done = () => {
      clearInterval(tick);
      xhrRef.current = null;
    };
    xhr.onload = () => {
      done();
      const d = xhr.response ?? {};
      if (xhr.status >= 200 && xhr.status < 300 && d.image) {
        setConcept(d.image);
        setStatus((s) => (!s.loading && s.available ? { ...s, remaining: d.remaining } : s));
        setPhase("result");
        requestAnimationFrame(() => stageRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
      } else {
        setError(d.error ?? "Não foi possível gerar a simulação agora.");
        setPhase("imagine");
        if (xhr.status === 429 || xhr.status === 503) refreshStatus();
      }
    };
    xhr.onerror = () => {
      done();
      setError("A conexão caiu durante o envio. Verifique a internet e tente novamente.");
      setPhase("imagine");
    };
    xhr.ontimeout = () => {
      done();
      setError("A geração demorou demais. Tente novamente em instantes.");
      setPhase("imagine");
    };
    xhr.onabort = () => {
      done();
      setPhase("imagine");
    };
    xhr.send(fd);
  }

  const summary = useMemo(() => describeChoice(choice), [choice]);
  const canGenerate = !!photo && !status.loading && status.available && status.remaining > 0;

  const [leadImages, setLeadImages] = useState<{ originalImage?: string; conceptImage?: string }>({});
  useEffect(() => {
    if (!wantsEvaluation || !photo) return;
    let alive = true;
    (async () => {
      const original = await shrinkDataUrl(await blobToDataUrl(photo.blob), 1600);
      const conceptSmall = concept ? await shrinkDataUrl(concept, 1600) : undefined;
      if (alive) setLeadImages({ originalImage: original, conceptImage: conceptSmall });
    })();
    return () => {
      alive = false;
    };
  }, [wantsEvaluation, photo, concept]);

  const steps = ["Envie seu carro", "Imagine", "Visualize", "Avalie"];
  const stepIndex = wantsEvaluation ? 3 : phase === "upload" ? 0 : phase === "imagine" ? 1 : 2;

  return (
    <div>
      {!status.loading && !status.available && (
        <div role="status" className="mb-10 flex flex-col gap-2 rounded-[3px] border border-[var(--line-dark)] bg-graphite px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.9375rem]">
            <span className="font-medium">Geração indisponível no momento.</span> <span className="text-silver">{status.message}</span>
          </p>
          <p className="caption text-mist">Você ainda pode enviar a foto e as preferências para uma avaliação.</p>
        </div>
      )}

      <ol className="mb-10 grid grid-cols-4 gap-2" aria-label="Etapas">
        {steps.map((s, i) => (
          <li key={s} aria-current={i === stepIndex ? "step" : undefined}>
            <span className={`block h-[3px] transition-colors duration-500 ${i <= stepIndex ? "bg-ivory" : "bg-ivory/15"}`} />
            <span className={`caption mt-2 block ${i === stepIndex ? "text-ivory" : "text-mist"}`}>
              <span className="tabular">{i + 1}.</span> {s}
            </span>
          </li>
        ))}
      </ol>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Stage */}
        <div ref={stageRef} className="min-w-0 scroll-mt-[calc(var(--nav-h)+1rem)] lg:col-span-7">
          <div className="lg:sticky lg:top-[calc(var(--nav-h)+1.5rem)]">
            {!photo ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  acceptFile(e.dataTransfer.files?.[0]);
                }}
                className={`relative grid min-h-[24rem] place-items-center overflow-hidden rounded-[3px] border border-dashed py-10 sm:aspect-[4/3] sm:min-h-0 transition-colors ${drag ? "border-ivory bg-ivory/[0.06]" : "border-ivory/30 bg-graphite"}`}
              >
                <div className="px-6 text-center">
                  <Upload size={32} className="mx-auto text-silver" />
                  <p className="mt-5 font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-tight">Envie a foto do seu carro</p>
                  <p className="mx-auto mt-3 max-w-[38ch] text-[0.9375rem] text-silver">
                    De preferência o carro inteiro, de frente ou de três quartos, com boa luz. JPG, PNG ou WEBP.
                  </p>
                  <button type="button" className="btn btn-primary mt-7" onClick={() => inputRef.current?.click()}>
                    <ImageIcon /> Escolher fotografia
                  </button>
                  <p className="caption mt-4 text-mist">Ou arraste a imagem para cá. A foto não é guardada pela Mercantil.</p>
                </div>
              </div>
            ) : phase === "result" && concept ? (
              <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
                <Comparator
                  before={{ src: photo.url, alt: "Foto original enviada" }}
                  after={{ src: concept, alt: `Simulação conceitual: ${summary}` }}
                  beforeLabel="Original"
                  afterLabel="Conceito · IA"
                  aspect={`${photo.w} / ${photo.h}`}
                  maxHeight="calc(100svh - var(--nav-h) - 13rem)"
                />
                <p className="caption mt-4 text-silver">
                  <span className="prov" data-kind="concept">
                    Simulação conceitual gerada por inteligência artificial. O resultado real depende de avaliação técnica.
                  </span>
                </p>
              </motion.div>
            ) : (
              <figure
                className="relative mx-auto overflow-hidden rounded-[3px] bg-night"
                style={{ aspectRatio: `${photo.w} / ${photo.h}`, width: `min(100%, calc((100svh - var(--nav-h) - 9rem) * ${photo.w} / ${photo.h}))` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
                <img src={photo.url} alt="Foto enviada do seu carro" className={`h-full w-full object-contain transition-[filter] duration-700 ${phase === "generating" ? "brightness-[0.55] saturate-50" : ""}`} />
                <AnimatePresence>
                  {phase === "generating" && (
                    <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {!reduce && <div aria-hidden className="vision-sweep absolute inset-0" />}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/90 to-transparent p-5 pt-16" role="status" aria-live="polite">
                        <p className="font-display text-[1.625rem] leading-tight">
                          {progress.stage === "upload" ? "Enviando a fotografia…" : "Gerando o conceito…"}
                        </p>
                        <p className="caption tabular mt-2 text-silver">
                          {progress.stage === "upload"
                            ? `${progress.pct}% enviado`
                            : `${progress.elapsed}s · costuma levar de 30 a 90 segundos. Pode continuar nesta página.`}
                        </p>
                        <div className="mt-3 h-[2px] w-full bg-ivory/15">
                          <div
                            className="h-full bg-ivory transition-[width] duration-500"
                            style={{ width: progress.stage === "upload" ? `${progress.pct * 0.15}%` : `${Math.min(95, 15 + progress.elapsed * 1.1)}%` }}
                          />
                        </div>
                        <button type="button" className="link-line caption mt-3 text-silver hover:text-ivory" onClick={() => xhrRef.current?.abort()}>
                          Cancelar
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <figcaption className="caption absolute top-3 left-3 rounded-sm bg-night/70 px-2 py-1 text-silver">Sua foto</figcaption>
              </figure>
            )}

            {photo && phase !== "generating" && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button type="button" className="btn btn-quiet !min-h-11" onClick={() => inputRef.current?.click()}>
                  <Upload size={16} /> Trocar foto
                </button>
                {phase === "result" && concept && (
                  <a className="btn btn-quiet !min-h-11" href={concept} download="mercantil-vision-conceito.webp">
                    <Download size={16} /> Salvar conceito
                  </a>
                )}
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT.join(",")}
              className="sr-only"
              aria-label="Escolher fotografia do carro"
              onChange={(e) => {
                acceptFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {error && (
              <p role="alert" className="mt-4 rounded-[3px] border border-[#e0868f]/40 bg-[#e0868f]/10 px-4 py-3 text-[0.9375rem]">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="lg:col-span-5">
          {phase === "result" && !wantsEvaluation ? (
            <div className="space-y-8">
              <div>
                <h2 className="h-sub font-display">O próximo capítulo, em conceito.</h2>
                <p className="mt-3 text-silver">{summary.charAt(0).toUpperCase() + summary.slice(1)}.</p>
                <p className="caption mt-3 text-mist">
                  <span className="prov" data-kind="concept">Simulação gerada por IA, não é fotografia de trabalho executado.</span>
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button type="button" className="btn btn-primary" onClick={() => setWantsEvaluation(true)}>
                  Quero avaliar esse projeto com a Mercantil <ArrowRight className="arrow" />
                </button>
                <button type="button" className="btn btn-quiet" onClick={() => setPhase("imagine")}>
                  <Sliders size={16} /> Alterar preferências
                </button>
                <button type="button" className="btn btn-quiet" disabled={!canGenerate} onClick={generate}>
                  <Refresh size={16} /> Nova tentativa
                </button>
                {!status.loading && status.available && (
                  <p className="caption tabular text-mist">
                    {status.remaining > 0 ? `${status.remaining} de ${status.perClient} simulações restantes hoje.` : "Você usou as simulações de hoje."}
                  </p>
                )}
              </div>
            </div>
          ) : wantsEvaluation ? (
            <div>
              <h2 className="h-sub font-display">Avaliar com a Mercantil</h2>
              <p className="mt-3 mb-8 text-silver">
                Envie seus dados para a Mercantil analisar o projeto. O pedido segue com as preferências escolhidas.
              </p>
              <LeadForm
                journey="vision"
                hasImages
                extra={() => ({ visionBrief: summary.slice(0, 600), ...leadImages })}
                submitLabel="Enviar para avaliação"
              />
              <button type="button" className="link-line caption mt-6 text-silver" onClick={() => setWantsEvaluation(false)}>
                Voltar
              </button>
            </div>
          ) : (
            <Preferences
              choice={choice}
              setChoice={setChoice}
              disabled={phase === "generating"}
              summary={summary}
              footer={
                <div className="space-y-3">
                  <button type="button" className="btn btn-primary w-full" disabled={!canGenerate || phase === "generating"} onClick={generate}>
                    {phase === "generating" ? "Gerando…" : "Visualizar meu projeto"} {phase !== "generating" && <ArrowRight className="arrow" />}
                  </button>
                  {!photo && <p className="caption text-mist">Envie uma foto para habilitar a visualização.</p>}
                  {!status.loading && status.available && (
                    <p className="caption tabular text-mist">
                      {status.remaining > 0 ? `${status.remaining} de ${status.perClient} simulações disponíveis hoje · sem cadastro.` : "Você usou as simulações de hoje. Ainda pode pedir uma avaliação."}
                    </p>
                  )}
                  {photo && (
                    <button type="button" className="btn btn-quiet w-full" onClick={() => setWantsEvaluation(true)}>
                      Pedir avaliação sem gerar simulação
                    </button>
                  )}
                </div>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ChipGroup({
  legend,
  options,
  value,
  onChange,
  disabled,
}: {
  legend: string;
  options: VisionOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-3 text-[0.9375rem] font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={legend}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            className={`chip ${o.hex ? "" : "!pl-3.5"}`}
            onClick={() => onChange(o.id)}
          >
            {o.hex && <span aria-hidden className="chip-swatch" style={{ background: o.hex }} />}
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Preferences({
  choice,
  setChoice,
  disabled,
  summary,
  footer,
}: {
  choice: VisionChoice;
  setChoice: React.Dispatch<React.SetStateAction<VisionChoice>>;
  disabled: boolean;
  summary: string;
  footer: React.ReactNode;
}) {
  const set = (k: keyof VisionChoice) => (v: string) => setChoice((c) => ({ ...c, [k]: v }));
  return (
    <div className="space-y-8">
      <div>
        <h2 className="h-sub font-display">Imagine a transformação</h2>
        <p className="mt-2 text-[0.9375rem] text-silver">Escolha na cartela ou descreva. Só a aparência muda — modelo e proporções são preservados.</p>
      </div>
      <ChipGroup legend="Pintura" options={paintOptions} value={choice.paint} onChange={set("paint")} disabled={disabled} />
      <ChipGroup legend="Teto (saia e blusa)" options={roofOptions} value={choice.roof} onChange={set("roof")} disabled={disabled} />
      <ChipGroup legend="Estilo" options={styleOptions} value={choice.style} onChange={set("style")} disabled={disabled} />
      <ChipGroup legend="Rodas" options={wheelOptions} value={choice.wheels} onChange={set("wheels")} disabled={disabled} />
      <details className="group border-t border-[var(--line-dark)] pt-5">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-[0.9375rem] font-medium [&::-webkit-details-marker]:hidden">
          Mais preferências: acabamento, interior e descrição
          <Plus size={18} className="transition-transform duration-500 group-open:rotate-45" />
        </summary>
        <div className="mt-6 space-y-8">
      <ChipGroup legend="Acabamento" options={finishOptions} value={choice.finish} onChange={set("finish")} disabled={disabled} />
      <ChipGroup legend="Interior (quando visível na foto)" options={interiorOptions} value={choice.interior} onChange={set("interior")} disabled={disabled} />
      <div>
        <label htmlFor="vision-notes" className="field-label">Descreva o projeto <span className="font-normal text-silver">(opcional)</span></label>
        <textarea
          id="vision-notes"
          rows={3}
          maxLength={400}
          disabled={disabled}
          value={choice.notes}
          onChange={(e) => setChoice((c) => ({ ...c, notes: e.target.value }))}
          placeholder="Ex.: frisos cromados bem polidos, faixa branca nos pneus"
          className="field resize-y"
          aria-describedby="vision-notes-count"
        />
        <p id="vision-notes-count" className="caption tabular mt-1.5 text-right text-mist">{choice.notes.length}/400</p>
      </div>
        </div>
      </details>
      <div className="border-t border-[var(--line-dark)] pt-6">
        <p className="caption text-mist">Seu pedido</p>
        <p className="mt-1 text-[0.9375rem]">{summary.charAt(0).toUpperCase() + summary.slice(1)}.</p>
      </div>
      {footer}
    </div>
  );
}
