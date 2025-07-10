import { NextResponse } from "next/server";

/**
 * Test endpoint for cron job functionality
 * This endpoint can be used to test the cron job setup
 */
export async function GET() {
  try {
    const testUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}/api/cron/cleanup?dryRun=true`
      : `http://localhost:3000/api/cron/cleanup?dryRun=true`;

    const response = await fetch(testUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CRON_SECRET || "dev-secret"}`,
      },
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: "Cron job test completed",
      testUrl,
      cronResult: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job test error:", error);
    return NextResponse.json(
      {
        error: "Cron job test failed",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET(); // Same functionality for both GET and POST
}
