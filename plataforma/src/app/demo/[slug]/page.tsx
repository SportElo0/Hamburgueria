import { notFound } from 'next/navigation';
import { DEMOS } from '@/lib/demo-app';
import { DemoApp } from '@/components/app/DemoApp';

export const metadata = { title: 'Demonstração', robots: { index: false, follow: false } };

/** Public demo of an "App sob medida": made-up customers, simulated AI, nothing saved or sent. */
export default async function DemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const demo = Object.hasOwn(DEMOS, slug) ? DEMOS[slug] : null;
  if (!demo) notFound();
  return <DemoApp demo={demo} />;
}
