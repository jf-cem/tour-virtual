// R21 furniture is authored in separate nodes; preserve each source world transform.
export const belongsToHouse=o=>/^R6_House_|^R20_RoundTable_|^R21_HighTable_/.test(o.name)||['R9_House_Platform_Seats','R8_Water_WEB'].includes(o.name);
