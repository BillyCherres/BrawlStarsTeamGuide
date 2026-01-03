export function toTagSet(tags: string[]) {
    return new Set(tags.map(t => t.trim().toLowerCase()).filter(Boolean));
  }
  
  export function getTagValue(tags: Set<string>, key: string): string | null {
    const k = key.toLowerCase() + ":";
    for (const t of tags) {
      if (t.startsWith(k)) return t.slice(k.length);
    }
    return null;
  }
  
  export function getTagNumber(tags: Set<string>, key: string): number | null {
    const v = getTagValue(tags, key);
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  
  export function hasTag(tags: Set<string>, tag: string) {
    return tags.has(tag.toLowerCase());
  }
  
  export function countWhere<T>(arr: T[], pred: (x: T) => boolean) {
    let c = 0;
    for (const x of arr) if (pred(x)) c++;
    return c;
  }
  