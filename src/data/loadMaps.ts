import raw from "./maps.tagged.json";
import type { TaggedMap } from "./types";

export const MAPS: TaggedMap[] = (raw as TaggedMap[]).map((m) => ({
  ...m,
  tags: (m.tags ?? []).map(t => t.trim().toLowerCase()).filter(Boolean),
}));
