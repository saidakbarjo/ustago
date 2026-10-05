export const dynamic = "force-static";
import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "USTAGO", short_name: "USTAGO", description: "Find verified specialists in Uzbekistan", start_url: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/`, display: "standalone", background_color: "#ffffff", theme_color: "#3a55ff", icons: [{ src: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/icon.svg`, sizes: "any", type: "image/svg+xml" }] };
}
