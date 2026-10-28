import { Capitulo1937 } from '@/components/home/Capitulo1937';
import { Encerramento } from '@/components/home/Encerramento';
import { Fabrica } from '@/components/home/Fabrica';
import { Hero } from '@/components/home/Hero';
import { Linhas } from '@/components/home/Linhas';
import { Precisao } from '@/components/home/Precisao';
import { Rede } from '@/components/home/Rede';

export default function Home() {
  return (
    <>
      {/* the hero is sticky; the chapters slide over it */}
      <div className="relative">
        <Hero />
        <Precisao />
      </div>
      <Capitulo1937 />
      <Linhas />
      <Fabrica />
      <Rede />
      <Encerramento />
    </>
  );
}
