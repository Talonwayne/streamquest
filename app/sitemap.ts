import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://streamquest-green.vercel.app").replace(
    /\/$/,
    ""
  );

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/requests",
    "/requests/new",
    "/live",
    "/trending",
    "/map",
    "/categories",
    "/explore/investigative-journalism",
    "/explore/travel",
    "/streamers/dashboard",
  ].map((path) => ({
    url: `${appUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/live" || path === "/map" ? "hourly" : "daily",
    priority: path === "" ? 1 : 0.7,
  }));

  try {
    const supabase = await createClient();
    const { data: requests } = await supabase
      .from("requests")
      .select("id, updated_at")
      .order("updated_at", { ascending: false })
      .limit(500);

    const requestRoutes: MetadataRoute.Sitemap = (requests ?? []).map((r) => ({
      url: `${appUrl}/requests/${r.id}`,
      lastModified: new Date(r.updated_at),
      changeFrequency: "daily",
      priority: 0.6,
    }));

    return [...staticRoutes, ...requestRoutes];
  } catch {
    return staticRoutes;
  }
}
