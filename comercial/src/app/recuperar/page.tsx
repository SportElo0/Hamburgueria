import Link from 'next/link';
import { pedirNovaSenha } from '@/app/acoes';
import { TelaDeAcesso } from '@/componentes/acesso';
import { Enviar, Formulario } from '@/componentes/formulario';

export const metadata = { title: 'Recuperar acesso' };

export default function Recuperar() {
  return (
    <TelaDeAcesso titulo="Recuperar acesso" rodape={<Link className="underline" href="/login">Voltar para entrar</Link>}>
      <p className="mb-4 text-[15px]">Escreva o e-mail do seu login. Você recebe um link para criar uma senha nova (vale 1 hora).</p>
      <Formulario acao={pedirNovaSenha} className="space-y-4">
        <div>
          <label className="rotulo" htmlFor="email">E-mail</label>
          <input className="campo" id="email" name="email" type="email" autoComplete="username" required />
        </div>
        <Enviar className="w-full">Pedir link</Enviar>
      </Formulario>
    </TelaDeAcesso>
  );
}
