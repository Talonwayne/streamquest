import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://streamquest-green.vercel.app").replace(
    /\/$/,
    ""
  );

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/", "/profile"],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
