import dynamic from "next/dynamic";

const GameWithNoSSR = dynamic(() => import("../app/game"), {
  ssr: false
});

export default GameWithNoSSR;