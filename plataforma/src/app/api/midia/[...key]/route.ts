import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

// Photos live in the private store; each upload gets a new random name, so responses are immutable.
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  if (key.length !== 2 || !/^[a-z0-9-]+$/.test(key[0]) || !/^[a-z0-9]+\.(jpg|png|webp|avif)$/.test(key[1])) {
    return new NextResponse('Not found', { status: 404 });
  }
  const file = await storage().readFile(`midia/${key[0]}/${key[1]}`);
  if (!file) return new NextResponse('Not found', { status: 404 });
  const body: BodyInit = Buffer.isBuffer(file.body) ? new Uint8Array(file.body) : (file.body as ReadableStream<Uint8Array>);
  return new NextResponse(body, {
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
