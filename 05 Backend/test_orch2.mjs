console.log("start");
import("./src/research/orchestrator.ts").then(m=>{
  console.log("imported orchestrator 2");
  console.log("keys", Object.keys(m));
  setTimeout(()=>{console.log("done"); process.exit(0)}, 2000);
}).catch(e=>console.error(e));
