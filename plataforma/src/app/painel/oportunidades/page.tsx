import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { chaveConfigurada, limites, listarLeads, listarPesquisas, usoDoMes } from '@/lib/oportunidades/dados';
import { segmento } from '@/lib/oportunidades/regras';
import { NovaPesquisa } from '@/components/oportunidades/NovaPesquisa';
import { ListaOportunidades } from '@/components/oportunidades/ListaOportunidades';
import { dataCurta } from '@/components/oportunidades/estilos';

export const metadata = { title: 'Oportunidades' };

export default async function OportunidadesPage() {
  await requireUser();
  const [leads, pesquisas, uso] = await Promise.all([listarLeads(), listarPesquisas(), usoDoMes()]);
  const lim = limites();
  return (
    <>
      <Link href="/painel" className="text-sm text-ink-mute hover:text-ink">
        ← Lojas
      </Link>
      <div className="mt-2">
        <h1 className="text-3xl font-bold">Oportunidades</h1>
        <p className="mt-1 max-w-3xl text-ink-soft">
          Negócios da região que podem precisar de site. A busca usa a Places API do Google; o painel guarda só o identificador do lugar e o que a equipe concluiu.
        </p>
      </div>

      <details className="card mt-4 p-4 text-sm text-ink-soft">
        <summary className="cursor-pointer font-semibold text-ink">Regras desta aba</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Toda pesquisa mostra o custo antes e só roda com aprovação. O painel tem limite de buscas por mês, abaixo da parte grátis do Google.</li>
          <li>Nome, endereço, telefone e site vindos do Google aparecem na tela e não são guardados nem exportados (termos do Google Maps Platform). O CSV leva o place ID, o link do Maps e as conclusões da equipe.</li>
          <li>&quot;Sem website&quot; só vale como confirmado depois de conferir pelo menos 2 outras fontes públicas, anotadas com data.</li>
          <li>Este painel não envia mensagem nenhuma. Contato é feito por uma pessoa, um negócio por vez, dizendo quem é e por que está falando. Se pedirem para não contatar, marque &quot;Não contatar&quot;. Campanha de WhatsApp só para quem aceitou receber.</li>
        </ul>
      </details>

      <NovaPesquisa chave={chaveConfigurada()} usadas={uso.busca} limite={lim.busca} />

      <ListaOportunidades key={`${leads.length}-${pesquisas[0]?.id ?? ''}`} leads={leads} usadasDetalhes={uso.detalhes} limiteDetalhes={lim.detalhes} />

      {pesquisas.length > 0 && (
        <section className="mt-10" aria-labelledby="historico">
          <h2 id="historico" className="text-xl font-bold">
            Pesquisas feitas
          </h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-card">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-ink-soft">
                <tr>
                  <th className="px-3 py-2 font-semibold">Data</th>
                  <th className="px-3 py-2 font-semibold">Busca</th>
                  <th className="px-3 py-2 font-semibold">Chamadas</th>
                  <th className="px-3 py-2 font-semibold">Encontrados</th>
                  <th className="px-3 py-2 font-semibold">Novos</th>
                  <th className="px-3 py-2 font-semibold">Quem</th>
                </tr>
              </thead>
              <tbody>
                {pesquisas.slice(0, 30).map((p) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="px-3 py-2">{dataCurta(p.em)}</td>
                    <td className="px-3 py-2">
                      {segmento(p.segmento).nome} em {p.bairro ? `${p.bairro}, ` : ''}
                      {p.cidade} - {p.uf}
                    </td>
                    <td className="px-3 py-2">{p.chamadas}</td>
                    <td className="px-3 py-2">
                      {p.encontrados}
                      {p.foraDaCidade > 0 && <span className="text-ink-mute"> (+{p.foraDaCidade} fora)</span>}
                    </td>
                    <td className="px-3 py-2">{p.novos}</td>
                    <td className="px-3 py-2 text-ink-mute">{p.por}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
