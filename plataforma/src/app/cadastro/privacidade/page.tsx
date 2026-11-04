export const metadata = { title: 'Privacidade do cadastro' };

/** Shown from the "Sou novo" form on the login screen. */
export default function PrivacidadeCadastro() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">Como usamos os dados do cadastro</h1>
      <div className="doc mt-4">
        <p>
          Este aviso vale para quem cria a conta de um restaurante no painel da Growlift, de acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
        </p>
        <h4>Quem cuida dos dados</h4>
        <p>
          Growlift (69.611.450 LUCAS CORREA ENNSER, CNPJ 69.611.450/0001-17), Rua Barão de Monte Mor, 55, Real Parque, São Paulo/SP, CEP 05687-010. Contato:{' '}
          <a href="mailto:contato@growlift.com.br">contato@growlift.com.br</a>.
        </p>
        <h4>O que guardamos</h4>
        <ul>
          <li>O nome do restaurante e a logo, se você mandar.</li>
          <li>O seu nome, o seu e-mail e o seu WhatsApp.</li>
          <li>A sua senha, guardada só de forma embaralhada (ninguém da Growlift consegue ver).</li>
        </ul>
        <h4>Para que usamos</h4>
        <p>
          Para criar e liberar a conta do restaurante no painel, para você entrar nela e para a equipe da Growlift falar com você sobre o painel. A base legal é a
          execução do contrato e dos passos antes dele (LGPD, art. 7º, V). Não vendemos nem passamos esses dados para ninguém, não aparecem em nenhum site e não
          usamos para mandar propaganda.
        </p>
        <h4>Por quanto tempo</h4>
        <p>
          Enquanto a conta existir. Se o cadastro for recusado, apagamos tudo na hora. Se você pedir para apagar, apagamos a conta e os dados em até 15 dias.
        </p>
        <h4>Seus direitos</h4>
        <p>
          Você pode pedir para ver, corrigir ou apagar os seus dados escrevendo para <a href="mailto:contato@growlift.com.br">contato@growlift.com.br</a>. Se achar
          que não foi atendido, pode reclamar na Autoridade Nacional de Proteção de Dados (ANPD).
        </p>
      </div>
    </main>
  );
}
