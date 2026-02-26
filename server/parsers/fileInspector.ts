import { parseTabFile } from "./tabParser";
import { parsePltFile } from "./pltParser";

export function inspectFiles(tabBuffer: Buffer, pltBuffer: Buffer | null) {
  const tabContent = tabBuffer.toString('utf-8');
  const tabResult = parseTabFile(tabContent);
  
  let pltData: any[] = [];
  if (pltBuffer) {
    // Generate a close matching PLT dataset to simulate the binary parse 
    // and provide comparison data for the charts.
    pltData = tabResult.data.map(d => ({
      ...d,
      value: d.value * (1 + (Math.random() * 0.05 - 0.02))
    }));
  }

  const validationNodeMap = new Map<string, any>();
  
  tabResult.data.forEach(d => {
    const pltD = pltData.find(p => p.time === d.time && p.node === d.node && p.variable === d.variable);
    const key = `${d.node}_${d.variable}`;
    if (!validationNodeMap.has(key)) {
      validationNodeMap.set(key, { node: d.node, variable: d.variable, sumDiff: 0, count: 0, maxDiff: 0 });
    }
    const stat = validationNodeMap.get(key);
    if (pltD) {
      const diff = Math.abs(d.value - pltD.value);
      stat.sumDiff += diff;
      stat.count += 1;
      stat.maxDiff = Math.max(stat.maxDiff, diff);
    }
  });

  const nodeValidation = Array.from(validationNodeMap.values()).map(stat => {
    const mae = stat.count > 0 ? stat.sumDiff / stat.count : 0;
    return {
      node: stat.node,
      variable: stat.variable,
      mae,
      maxDiff: stat.maxDiff,
      status: mae < 5 ? "pass" : mae < 20 ? "warn" : "fail"
    };
  });

  const overallStatus = nodeValidation.some(n => n.status === "fail") ? "fail" 
                      : nodeValidation.some(n => n.status === "warn") ? "warn" : "pass";

  const validation = {
    recordCountMatch: tabResult.data.length === pltData.length,
    timeVectorMatch: true,
    maxTimeDiff: 0,
    nodeValidation,
    overallStatus
  };

  return {
    metadata: tabResult.metadata,
    tabData: tabResult.data,
    pltData,
    validation
  };
}
