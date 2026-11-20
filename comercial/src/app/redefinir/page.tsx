import Link from 'next/link';
import { redefinirSenha } from '@/app/acoes';
import { TelaDeAcesso } from '@/componentes/acesso';
import { Enviar, Formulario } from '@/componentes/formulario';

export const metadata = { title: 'Criar senha nova' };

export default async function Redefinir({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  return (
    <TelaDeAcesso titulo="Criar senha nova" rodape={<Link className="underline" href="/login">Voltar para entrar</Link>}>
      {!token || error ? (
        <p className="aviso bg-erro-clara text-erro">Link inválido ou vencido. Peça um novo em “Esqueci minha senha”.</p>
      ) : (
        <Formulario acao={redefinirSenha} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <div>
            <label className="rotulo" htmlFor="senha">Senha nova (pelo menos 10 caracteres)</label>
            <input className="campo" id="senha" name="senha" type="password" autoComplete="new-password" minLength={10} required />
          </div>
          <Enviar className="w-full">Salvar senha</Enviar>
        </Formulario>
      )}
    </TelaDeAcesso>
  );
}
