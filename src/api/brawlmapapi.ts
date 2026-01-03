export type BrawlifyMap = {
    id: number;
    name: string;
    imageUrl: string;
    disabled: boolean;
    gameMode: {
      id: number;
      name: string;
      hash: string;
      color: string;
      bgColor: string;
      imageUrl: string;
    };
  };
  
  export async function fetchMaps(): Promise<BrawlifyMap[]> {
    const res = await fetch("https://api.brawlify.com/v1/maps");
    if (!res.ok) throw new Error("Failed to fetch maps");
    const data = await res.json();
    return data.list as BrawlifyMap[];
  }