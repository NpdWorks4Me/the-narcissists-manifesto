console.log("start verify");
import("./src/research/verification.ts").then(m=>{console.log("imported verify");}).catch(e=>console.error(e));
