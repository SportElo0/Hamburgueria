import { desligarAvisoWhatsAppAcao, ligarAvisoWhatsAppAcao } from '@/app/acoes';
import { AppCelular } from '@/componentes/app-celular';
import { dataHora } from '@/componentes/formato';
import { Enviar, Formulario } from '@/componentes/formulario';
import { MENSAGEM_CONFIRMACAO, TEXTO_ACEITE_AVISOS, meuAvisoWhatsApp } from '@/server/avisos-whatsapp';
import { formatarTelefone, normalizarTelefone } from '@/server/config';
import { empresaPorId } from '@/server/empresas';
import { integracaoWhatsApp } from '@/server/integracoes';
import { aparelhosDe, chavesVapid } from '@/server/push';
import { exigirCtx } from '@/server/sessao';

export const metadata = { title: 'App no celular' };

export default async function Celular() {
  const ctx = await exigirCtx();
  const [aparelhos, zap, empresa, meu] = await Promise.all([aparelhosDe(ctx), integracaoWhatsApp(ctx.empresaId), empresaPorId(ctx.empresaId), meuAvisoWhatsApp(ctx)]);
  const chave = chavesVapid()?.publica ?? null;
  const zapPronto = zap.config.modo === 'oficial' && !!zap.config.modelo_aviso_equipe;
  const zapEmpresa = normalizarTelefone(empresa?.config.site.whatsapp ?? '');
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">App no celular</h1>
      <p className="text-[17px]">O painel vira um aplicativo no seu celular: ícone na tela inicial, abre em tela cheia e avisa quando chega pedido novo, quando um cliente espera uma pessoa e quando uma tarefa é sua.</p>
      <AppCelular chavePublica={chave} bloqueado={ctx.acessoAdmin ? 'O acesso da equipe Growlift não liga avisos no celular.' : null} />
      <section className="cartao p-5">
        <h2 className="text-lg font-bold">Seus aparelhos com avisos ligados</h2>
        {aparelhos.length === 0 ? (
          <p className="mt-2 text-suave">Nenhum ainda.</p>
        ) : (
          <ul className="mt-2 divide-y divide-linha">
            {aparelhos.map((a) => (
              <li key={a.id} className="py-2 text-[15px]">
                <span className="font-semibold text-tinta">{a.aparelho || 'Aparelho'}</span>
                <span className="block text-sm text-suave">Ligado em {dataHora(a.criado_em)}{a.ultimo_envio_em ? ` · último aviso ${dataHora(a.ultimo_envio_em)}` : ''}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-sm text-suave">O aviso mostra só o assunto (por exemplo, “Novo pedido” ou “Nova mensagem do cliente”) e o nome da empresa. O nome e as mensagens do cliente ficam no painel, não aparecem na tela bloqueada.</p>
      </section>
      <section className="cartao p-5">
        <h2 className="text-lg font-bold">Avisos no seu WhatsApp</h2>
        <p className="mt-1 text-[15px]">Para quem não quer instalar o app: os avisos importantes (pedido novo, cliente esperando uma pessoa, ligação perdida e avaliação com nota baixa) chegam no seu WhatsApp, pelo número da empresa. Só o assunto e o link do painel, sem dados do cliente.</p>
        {!zapPronto && <p className="aviso mt-3 bg-alerta-clara text-alerta">Ainda não funciona nesta empresa: falta o WhatsApp oficial ligado e o modelo de mensagem aprovado pela Meta (a equipe Growlift cuida disso). Você já pode deixar ligado.</p>}
        {meu ? (
          <div className="mt-3 space-y-2">
            {meu.confirmado_em ? (
              <p className="text-[15px]">Ligado para <strong>{formatarTelefone(meu.telefone)}</strong>, confirmado em {dataHora(meu.confirmado_em)}{meu.ultimo_envio_em ? ` · último aviso ${dataHora(meu.ultimo_envio_em)}` : ''}.</p>
            ) : (
              <div className="aviso bg-alerta-clara text-alerta">
                <p>Falta confirmar que o número <strong>{formatarTelefone(meu.telefone)}</strong> é seu. Mande, desse WhatsApp para o número da empresa{zapEmpresa ? ` (${formatarTelefone(zapEmpresa)})` : ''}, a mensagem:</p>
                <p className="mt-1 text-lg font-bold tracking-wide">{MENSAGEM_CONFIRMACAO(meu.codigo ?? '')}</p>
                {zapEmpresa && <a className="mt-2 inline-block font-semibold underline" href={`https://wa.me/${zapEmpresa}?text=${encodeURIComponent(MENSAGEM_CONFIRMACAO(meu.codigo ?? ''))}`}>Abrir o WhatsApp com a mensagem pronta</a>}
                <p className="mt-1 text-sm">Até confirmar, nenhum aviso sai.</p>
              </div>
            )}
            <Formulario acao={desligarAvisoWhatsAppAcao}><Enviar secundario>Desligar avisos no WhatsApp</Enviar></Formulario>
          </div>
        ) : ctx.acessoAdmin ? (
          <p className="mt-3 text-sm text-suave">Cada pessoa liga no próprio WhatsApp, com o próprio login.</p>
        ) : (
          <Formulario acao={ligarAvisoWhatsAppAcao} className="mt-3 space-y-3">
            <div><label className="rotulo" htmlFor="telefone">Seu celular com DDD</label><input className="campo" id="telefone" name="telefone" inputMode="tel" placeholder="(11) 91234-5678" required /></div>
            <label className="flex items-start gap-2 text-[15px]"><input type="checkbox" name="aceite" required className="mt-1" /> <span>{TEXTO_ACEITE_AVISOS(empresa!.nome)}</span></label>
            <Enviar>Ligar avisos no WhatsApp</Enviar>
          </Formulario>
        )}
        <p className="mt-3 text-sm text-suave">A Meta cobra cada aviso da empresa, como as outras mensagens que a empresa inicia. No máximo 30 avisos por pessoa por dia.</p>
      </section>
    </div>
  );
}
