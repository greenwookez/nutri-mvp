import { NextRequest } from "next/server";

export function activityAuthorized(req: NextRequest) {
  const required = process.env.ACTIVITY_API_KEY;
  if (!required) return true;
  return req.headers.get("x-api-key") === required;
}
