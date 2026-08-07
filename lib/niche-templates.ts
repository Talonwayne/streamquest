import type { RequestCategory } from "@/types/database";

export interface NicheTemplate {
  title: string;
  blurb: string;
  tags: string[];
}

export const NICHE_TEMPLATES: Partial<Record<RequestCategory, NicheTemplate[]>> = {
  investigative_journalism: [
    {
      title: "Live FOIA request walkthrough for a local agency",
      blurb: "Screen-share filing a public records request and explain what to ask for.",
      tags: ["foia", "local-government", "transparency"],
    },
    {
      title: "Investigate zoning / housing board meeting highlights",
      blurb: "Attend or watch a public meeting and break down what matters for residents.",
      tags: ["zoning", "housing", "city-council"],
    },
    {
      title: "Follow the money: trace a local contract or grant",
      blurb: "Use public databases to show where funds go, live with sources on screen.",
      tags: ["budgets", "contracts", "accountability"],
    },
    {
      title: "Fact-check a viral local claim with primary sources",
      blurb: "Pull documents, maps, and official stats while chat suggests leads.",
      tags: ["fact-check", "primary-sources"],
    },
  ],
  travel: [
    {
      title: "Live night market walk — street food and stalls",
      blurb: "Handheld tour of a night market with tastes, prices, and tips.",
      tags: ["night-market", "street-food", "walking-tour"],
    },
    {
      title: "Neighborhood first-timer guide (transit + spots)",
      blurb: "Arrive by transit and show how a visitor should spend 4 hours.",
      tags: ["neighborhood", "transit", "first-timer"],
    },
    {
      title: "Hidden viewpoint / hike with live arrival",
      blurb: "Stream the approach and the view — no spoiler thumbnails needed.",
      tags: ["hike", "viewpoint", "outdoors"],
    },
    {
      title: "Budget day in a capital city under $40",
      blurb: "Food, transit, and one paid attraction — track every expense live.",
      tags: ["budget", "city-day", "backpacking"],
    },
  ],
};
