import { redirect } from 'next/navigation';
import { Enviar, Formulario, type Retorno } from '@/componentes/formulario';
import { conviteAberto, registrarCliquePublico, registrarFeedbackPrivado } from '@/server/avaliacoes';
import { ErroDeUso } from '@/server/erros';

export const metadata = { title: 'Como foi sua experiência?' };

export default async function Avaliar({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const c = await conviteAberto(token);

  async function irParaPublica() {
    'use server';
    const atual = await conviteAberto(token);
    if (!atual) redirect('/');
    await registrarCliquePublico(token);
    redirect(atual.linkPublico);
  }
  async function enviarPrivado(_: Retorno, fd: FormData): Promise<Retorno> {
    'use server';
    try {
      await registrarFeedbackPrivado(token, Number(fd.get('nota')), String(fd.get('comentario') ?? ''));
      return { ok: 'Obrigado! Seu recado foi entregue à empresa. O botão de avaliação pública continua aqui em cima.' };
    } catch (err) {
      return { erro: err instanceof ErroDeUso ? err.message : 'Não foi possível enviar agora.' };
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10">
      {!c ? (
        <div className="cartao p-6"><h1 className="text-xl font-bold">Convite não encontrado</h1><p className="mt-2">Este link não é mais válido. Peça um novo à empresa.</p></div>
      ) : (
        <div className="space-y-4">
          <div className="cartao p-6">
            <h1 className="text-2xl font-bold">Como foi sua experiência com a {c.empresa}?</h1>
            <p className="mt-2 text-[17px]">Sua opinião ajuda outras pessoas a escolher. A avaliação é pública e é você quem escreve, do seu jeito.</p>
            <form action={irParaPublica} className="mt-4"><button className="botao w-full">Avaliar publicamente</button></form>
          </div>
          <div className="cartao p-6">
            <h2 className="text-lg font-bold">Prefere mandar um recado só para a empresa?</h2>
            <p className="mt-1 text-[15px] text-suave">É opcional e não substitui a avaliação pública: o botão acima continua disponível, qualquer que seja a sua nota.</p>
            <Formulario acao={enviarPrivado} className="mt-3 space-y-3">
              <fieldset>
                <legend className="rotulo">Nota de 1 a 5</legend>
                <div className="flex gap-2">{[1, 2, 3, 4, 5].map((n) => <label key={n} className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1 rounded-lg border border-linha px-3 font-semibold has-checked:border-marca has-checked:bg-marca-clara"><input type="radio" name="nota" value={n} required className="sr-only" />{n}</label>)}</div>
              </fieldset>
              <div><label className="rotulo" htmlFor="comentario">Recado (opcional)</label><textarea className="campo" id="comentario" name="comentario" rows={3} maxLength={1000} /></div>
              <Enviar secundario>Enviar recado privado</Enviar>
            </Formulario>
            {c.jaRespondeu && <p className="mt-2 text-sm text-suave">Você já enviou um recado. Pode enviar outro, se quiser.</p>}
          </div>
        </div>
      )}
    </main>
  );
}
