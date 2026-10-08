const fs=require('node:fs'),R=require('../movement-replay.js');
if(!process.argv[2]){console.error('Usage: node tests/replay.cjs session.json');process.exit(1);}
const session=JSON.parse(fs.readFileSync(process.argv[2],'utf8').replace(/^\uFEFF/,''));
console.log(JSON.stringify(R.compare(session),null,2));
