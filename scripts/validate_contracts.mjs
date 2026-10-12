import { resolve } from 'node:path';
import { validateSystemContracts } from '../.yaaw-core/system/engine/contracts.mjs';
const system=resolve(process.argv[2]??'.yaaw-core/system'),skills=process.argv[3]?resolve(process.argv[3]):null;
const errors=await validateSystemContracts(system,skills);
if(errors.length){console.error('YAAW dispatch-contract validation failed:\n'+errors.map(e=>'- '+e).join('\n'));process.exitCode=1}
else console.log('YAAW dispatch-contract validation passed.');
