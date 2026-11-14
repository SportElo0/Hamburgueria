import Link from 'next/link';
import { redirect } from 'next/navigation';
import { entrar, entrarDemonstracao } from '@/app/acoes';
import { TelaDeAcesso } from '@/componentes/acesso';
import { Enviar, Formulario } from '@/componentes/formulario';
import { ambiente } from '@/server/config';
import { demonstracaoAberta } from '@/server/demonstracao';
import { sessao } from '@/server/sessao';

export const metadata = { title: 'Entrar' };

export default async function Login({ searchParams }: { searchParams: Promise<{ convite?: string; senha?: string; sem?: string }> }) {
  const sp = await searchParams;
  const s = await sessao();
  if (s?.ctx) redirect('/painel');
  if (s?.adminPlataforma) redirect('/admin');
  return (
    <TelaDeAcesso titulo="Entrar" rodape={<Link className="underline" href="/recuperar">Esqueci minha senha</Link>}>
      {sp.convite && <p className="aviso mb-4 bg-ok-clara text-ok">Acesso criado. Entre com seu e-mail e a senha que você escolheu.</p>}
      {sp.senha && <p className="aviso mb-4 bg-ok-clara text-ok">Senha alterada. Entre com a senha nova.</p>}
      {(sp.sem || s) && <p className="aviso mb-4 bg-alerta-clara text-alerta">Este login não está ligado a nenhuma empresa ativa. Fale com o administrador.</p>}
      <Formulario acao={entrar} className="space-y-4">
        <div>
          <label className="rotulo" htmlFor="email">E-mail</label>
          <input className="campo" id="email" name="email" type="email" autoComplete="username" required />
        </div>
        <div>
          <label className="rotulo" htmlFor="senha">Senha</label>
          <input className="campo" id="senha" name="senha" type="password" autoComplete="current-password" required />
        </div>
        <Enviar className="w-full">Entrar</Enviar>
      </Formulario>
      {demonstracaoAberta() && (
        <div className="mt-5 border-t border-linha pt-5">
          <Formulario acao={entrarDemonstracao}>
            <Enviar secundario className="w-full">Entrar na demonstração (sem senha)</Enviar>
          </Formulario>
          <p className="mt-2 text-sm text-suave">
            Entra como dono da Lumivale Energia Solar, uma empresa fictícia. Dá para ver e testar o painel; ajustes, convites, chaves e o envio de propostas ficam bloqueados.
          </p>
          <p className="mt-3 text-sm text-suave">
            Ambiente de {ambiente() === 'demonstracao' ? 'demonstração' : 'desenvolvimento'}: os outros logins de exemplo estão no README (<code>npm run demo</code>).
          </p>
        </div>
      )}
    </TelaDeAcesso>
  );
}
