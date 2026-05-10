import { NextResponse } from "next/server";

export const ApiResponse = {
  ok: (data, status = 200) => NextResponse.json(data, { status }),

  error: (message, status = 500) =>
    NextResponse.json({ error: message }, { status }),

  unauthorized: (message = "Unauthorized") =>
    NextResponse.json({ error: message }, { status: 401 }),

  forbidden: (message = "Forbidden") =>
    NextResponse.json({ error: message }, { status: 403 }),

  badRequest: (message = "Bad request") =>
    NextResponse.json({ error: message }, { status: 400 }),

  notFound: (message = "Not found") =>
    NextResponse.json({ error: message }, { status: 404 }),

  conflict: (message = "Conflict") =>
    NextResponse.json({ error: message }, { status: 409 }),
};
