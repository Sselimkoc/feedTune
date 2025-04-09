import { NextResponse } from "next/server";

/**
 * DEPRECATED: Bu endpoint artık kullanılmıyor.
 * Lütfen bunun yerine /api/feed-sync endpoint'ini kullanın.
 *
 * Bu endpoint gelecekte kaldırılacaktır.
 */
export async function POST(request) {
  return NextResponse.json(
    {
      deprecated: true,
      message:
        "Bu endpoint artık kullanılmıyor. Lütfen /api/feed-sync endpoint'ini kullanın.",
      redirectTo: "/api/feed-sync",
    },
    { status: 307 }
  );
}

/**
 * DEPRECATED: Bu endpoint artık kullanılmıyor.
 * Lütfen bunun yerine /api/feed-sync endpoint'ini kullanın.
 */
export async function GET(request) {
  return NextResponse.json(
    {
      deprecated: true,
      message:
        "Bu endpoint artık kullanılmıyor. Lütfen /api/feed-sync endpoint'ini kullanın.",
      redirectTo: "/api/feed-sync",
    },
    { status: 307 }
  );
}
