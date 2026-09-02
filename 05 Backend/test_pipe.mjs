console.log("start pipe");
import("./src/research/pipeline.ts").then(m=>{console.log("imported pipeline");}).catch(e=>console.error(e));
