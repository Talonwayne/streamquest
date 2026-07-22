import type { Metadata } from "next";
import { LiveMapClient } from "@/components/live-map-client";

export const metadata: Metadata = {
  title: "Live map",
  description: "See where in the world people are streaming on Streamquest.",
};

export default function MapPage() {
  return (
    <div className="flex flex-1 flex-col">
      <LiveMapClient />
    </div>
  );
}
