// app/api/revalidate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs"; // ← Edge回避
export const dynamic = "force-dynamic"; // ← キャッシュ無効化

type Body = { secret?: string; path?: string };

export async function POST(req: NextRequest) {
  try {
    const { secret, path } = (await req.json()) as Body;
    if (!secret || secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json(
        { ok: false, reason: "unauthorized" },
        { status: 401 }
      );
    }
    if (!path) {
      return NextResponse.json(
        { ok: false, reason: "path required" },
        { status: 400 }
      );
    }

    // ここで再検証
    revalidatePath(path);

    return NextResponse.json({ ok: true, path }, { status: 200 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ ok: false, reason: msg }, { status: 500 });
  }
}

// 動作確認用（値は返すだけ）
export async function GET() {
  const hasSecret = Boolean(process.env.REVALIDATE_SECRET);
  return NextResponse.json({ ok: true, hasSecret }, { status: 200 });
}
