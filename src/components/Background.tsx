import type { ReactNode } from "react";
import bg from "../assets/bsbg.webp";

type Props = { children: ReactNode };

function Background ({children}: Props){
    return(
        <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* Overlay to make the content readable */}
      <div className="min-h-screen bg-black/50 backdrop-blur-[2px]">
        {children}
      </div>
    </div>
    );
}

export default Background;