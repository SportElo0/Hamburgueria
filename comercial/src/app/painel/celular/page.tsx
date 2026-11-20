import { AppCelular } from '@/componentes/app-celular';
import { dataHora } from '@/componentes/formato';
import { aparelhosDe, chavesVapid } from '@/server/push';
import { exigirCtx } from '@/server/sessao';

export const metadata = { title: 'App no celular' };

export default async function Celular() {
  const ctx = await exigirCtx();
  const aparelhos = await aparelhosDe(ctx);
  const chave = chavesVapid()?.publica ?? null;
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
    </div>
  );
}
