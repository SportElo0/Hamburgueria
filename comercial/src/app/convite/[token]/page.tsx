import Link from 'next/link';
import { aceitarConviteAcao } from '@/app/acoes';
import { TelaDeAcesso } from '@/componentes/acesso';
import { Enviar, Formulario } from '@/componentes/formulario';
import { conviteValido } from '@/server/empresas';

export const metadata = { title: 'Convite' };

export default async function Convite({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const c = await conviteValido(token);
  return (
    <TelaDeAcesso titulo={c ? `Convite da ${c.empresa}` : 'Convite'} rodape={<Link className="underline" href="/login">Já tenho acesso</Link>}>
      {!c ? (
        <p className="aviso bg-erro-clara text-erro">Convite inválido, vencido ou já usado. Peça um novo ao administrador da empresa.</p>
      ) : (
        <Formulario acao={aceitarConviteAcao} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <p className="text-[15px]">
            Você vai entrar como <strong>{c.papel === 'admin' ? 'administrador' : 'vendedor'}</strong> com o e-mail <strong>{c.email}</strong>.
          </p>
          <div>
            <label className="rotulo" htmlFor="nome">Seu nome</label>
            <input className="campo" id="nome" name="nome" autoComplete="name" required minLength={2} />
          </div>
          <div>
            <label className="rotulo" htmlFor="senha">Crie uma senha (pelo menos 10 caracteres)</label>
            <input className="campo" id="senha" name="senha" type="password" autoComplete="new-password" minLength={10} required />
          </div>
          <Enviar className="w-full">Criar meu acesso</Enviar>
        </Formulario>
      )}
    </TelaDeAcesso>
  );
}
