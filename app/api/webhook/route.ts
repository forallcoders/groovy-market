import 'dotenv/config';
import { revalidatePath } from 'next/cache';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const paths: string[] = body.paths ?? [];
    console.log(paths);
    const results = await Promise.allSettled([
      ...paths.map((path) => revalidatePath(path)),
    ]);
    return NextResponse.json({ results, paths });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: 'error' });
  }
}
