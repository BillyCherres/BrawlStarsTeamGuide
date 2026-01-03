export type Range = "melee" | "short" | "mid" | "long";
export type Role = "damage" | "support" | "tank" | "control" | "assassin";

export type Brawler = {
  id: string;
  name: string;
  roles: Role[];
  range: Range;
  mobility: 0 | 1 | 2 | 3;
  healing: 0 | 1 | 2 | 3;
  cc: 0 | 1 | 2 | 3;
};
