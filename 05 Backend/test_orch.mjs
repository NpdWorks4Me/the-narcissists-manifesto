console.log("start test_orch");
import("./src/research/orchestrator.ts").then(m=>{console.log("imported orchestrator", Object.keys(m)); setTimeout(()=>console.log("done"), 1000);}).catch(e=>{console.error("import err", e);});
