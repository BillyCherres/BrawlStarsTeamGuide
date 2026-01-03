export type TaggedEntity = {
    id: number | string;
    name: string;
    tags: string[];
  };
  
  // ---------------- BRAWLERS ----------------
  
  export type RawBrawlerTags = {
    rangeBucket: string;
    damageProfile: string;
    mobility: string;
    controlScore: number;
    sustainScore?: number;
    tankiness?: string;
    antiTank?: string;
    antiAssassin?: string;
    wallbreak?: boolean;
    vision?: boolean;
    areaDamage?: boolean;
    gemCarrierSuitability?: string;
  
    [key: string]: string | number | boolean | null | undefined;
  };
  
  export type RawTaggedBrawler = {
    id: number;
    name: string;
    class: string;
    rarity: string;
    imageUrl: string;
    starPowers: string[];
    gadgets: string[];
    tags: RawBrawlerTags;
    tagRevisionNotes?: Record<string, unknown>;
  };
  
  export type TaggedBrawler = Omit<RawTaggedBrawler, "tags"> & {
    tags: string[];       // flattened tags for filtering/synergy
    tagObj: RawBrawlerTags; // original object for debugging
  };
  
  // ---------------- MAPS ----------------
  
  export type TaggedMap = TaggedEntity & {
    gameMode?: string | null;
    environment?: string | null;
    mapType?: string | null;
    imageUrl?: string | null;
  };
  