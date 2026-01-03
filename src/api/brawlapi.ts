export type BrawlApiBrawler = {
    id: number;
    name: string;
    imageUrl?: string;
    imageUrl2?: string;
  };

  export type BrawlApiBrawlersResponse = {
    list?: BrawlApiBrawler[];
    items?: BrawlApiBrawler[];
  };
  
  export async function fetchBrawlers(): Promise<BrawlApiBrawler[]> {
    const res = await fetch("https://api.brawlify.com/v1/brawlers");
    if (!res.ok) throw new Error(`Failed to fetch brawlers: ${res.status}`);
  
    const data: BrawlApiBrawlersResponse = await res.json();
    return data.list ?? data.items ?? [];
  }