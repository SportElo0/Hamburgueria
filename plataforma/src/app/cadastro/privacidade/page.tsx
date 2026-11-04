import { AVISO_CADASTRO } from '@/lib/cadastros';

export const metadata = { title: 'Privacidade do cadastro' };

/** Shown from the "Sou novo" form on the login screen and from the waiting screen. */
export default function PrivacidadeCadastro() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">Como usamos os dados do cadastro</h1>
      <p className="mt-1 text-sm text-ink-mute">Última atualização: {AVISO_CADASTRO.atualizado}</p>
      <div className="doc mt-4">
        <p>
          Este aviso vale para quem cria a conta de um restaurante no painel da Growlift, de acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Ele
          trata só dos dados de quem cria a conta. Os dados dos clientes do restaurante que passarem pelo painel (pedidos, reservas) são do restaurante, e a
          Growlift só os guarda e processa por conta dele.
        </p>
        <h4>Quem cuida dos dados</h4>
        <p>
          Growlift (69.611.450 LUCAS CORREA ENNSER, CNPJ 69.611.450/0001-17), Rua Barão de Monte Mor, 55, Real Parque, São Paulo/SP, CEP 05687-010. Contato:{' '}
          <a href="mailto:contato@growlift.com.br">contato@growlift.com.br</a>. Para assuntos de privacidade, use o mesmo e-mail.
        </p>
        <h4>O que guardamos</h4>
        <ul>
          <li>O nome do restaurante e a logo, se você mandar.</li>
          <li>O seu nome, o seu e-mail e o seu WhatsApp.</li>
          <li>A sua senha, guardada só de forma embaralhada: não conseguimos ler a sua senha.</li>
          <li>A data em que você leu este aviso.</li>
        </ul>
        <h4>Para que usamos</h4>
        <p>
          Para criar e liberar a conta do restaurante no painel, para você entrar nela e para a equipe da Growlift falar com você sobre o painel. A base legal é a
          execução do contrato e dos passos antes dele (LGPD, art. 7º, V).
        </p>
        <p>
          O nome do restaurante e a logo serão usados para montar a loja do seu restaurante e podem aparecer no site e no cardápio dele, quando forem publicados. O
          seu nome, o seu e-mail, o seu WhatsApp e a sua senha não aparecem em nenhum site. Não vendemos esses dados, não passamos para ninguém fazer propaganda e
          não usamos para mandar propaganda.
        </p>
        <h4>Com quem os dados ficam</h4>
        <p>
          Para guardar e operar o painel usamos a Vercel (hospedagem) e o Supabase (banco de dados). Eles só tratam os dados para prestar esse serviço a nós e
          podem guardá-los em servidores fora do Brasil, com as garantias previstas na LGPD. Não compartilhamos com mais ninguém, a não ser que a lei obrigue.
        </p>
        <h4>Cookie e proteção contra robôs</h4>
        <p>
          Usamos um cookie só para manter você conectado. Não usamos cookies de propaganda nem de rastreamento. Para barrar cadastros em massa de robôs, usamos um
          código embaralhado do seu endereço de internet, que não permite identificar você.
        </p>
        <h4>Por quanto tempo</h4>
        <p>
          Enquanto estivermos avaliando o cadastro. Se a Growlift recusar, apagamos o cadastro, a senha e a logo no momento da recusa. Se o cadastro for aprovado,
          guardamos os dados enquanto a conta existir. Se você pedir para apagar, apagamos a conta e esses dados em até 15 dias, e podemos manter só o que a lei
          nos obrigar a guardar (por exemplo, registros de cobrança), pelo prazo que ela exigir. Cópias de segurança do nosso fornecedor saem do sistema pelo ciclo
          normal dele.
        </p>
        <h4>Seus direitos</h4>
        <p>
          Você pode pedir para ver, corrigir ou apagar os seus dados, receber uma cópia, saber com quem compartilhamos e se opor ao uso. Escreva para{' '}
          <a href="mailto:contato@growlift.com.br">contato@growlift.com.br</a> (para apagar, use o assunto &quot;Apagar meus dados&quot; e diga o nome do
          restaurante). Respondemos em até 15 dias. Se achar que não foi atendido, pode reclamar na Autoridade Nacional de Proteção de Dados (ANPD).
        </p>
      </div>
    </main>
  );
}
