import { revalidateTag } from "next/cache";
import { FEED_TAG, refreshFeed } from "@/lib/stories";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Re-runs the pipeline. Call it on a schedule with
 * `Authorization: Bearer $CRON_SECRET` (Vercel Cron sends this automatically).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const feed = await refreshFeed();
  revalidateTag(FEED_TAG);
  return Response.json({
    generatedAt: feed.generatedAt,
    articles: feed.articleCount,
    stories: feed.stories.length,
    failedSources: feed.failedSources,
  });
}
