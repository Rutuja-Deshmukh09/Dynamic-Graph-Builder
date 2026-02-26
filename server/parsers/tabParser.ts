export function parseTabFile(tabContent: string) {
  const lines = tabContent.split('\n');
  
  let runDate = "";
  let runTime = "";
  let projectName = "";
  
  // Extract Metadata
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i];
    if (line.includes("TIME HISTORIES FOR RUN OF")) {
      const match = line.match(/RUN OF\s+(.*?)\s+AT\s+(.*?)\s*$/);
      if (match) {
        runDate = match[1].trim();
        runTime = match[2].trim();
      }
    } else if (line.includes("TITLED:")) {
      projectName = line.split("TITLED:")[1].trim();
    }
  }

  let nodeRow = -1;
  for (let i = 0; i < 20; i++) {
    if (lines[i] && lines[i].includes("TIME") && lines[i].includes("NODE_")) {
      nodeRow = i;
      break;
    }
  }

  if (nodeRow === -1) {
    throw new Error("Could not find header rows in TAB file");
  }

  const nodesLine = lines[nodeRow];
  const varLine = lines[nodeRow + 1];
  
  // Build columns dynamically based on character centers
  const varRegex = /\S+/g;
  const dataColumns = [];
  
  let varMatch;
  while ((varMatch = varRegex.exec(varLine)) !== null) {
    const variable = varMatch[0];
    const center = varMatch.index + Math.floor(variable.length / 2);
    
    const nodeMatches = [...nodesLine.matchAll(/(NODE_NO_\d+|ELEM\w*)/g)];
    let assignedNode = "";
    for (const nm of nodeMatches) {
       if (nm.index! <= center + 5) {
          assignedNode = nm[0];
       }
    }

    dataColumns.push({
      center: center,
      variable: variable.replace(/\.$/, ''),
      node: assignedNode,
    });
  }

  const timeMatches = [...nodesLine.matchAll(/TIME/g)];

  const data: any[] = [];
  const nodesSet = new Set<string>();
  const variablesSet = new Set<string>();

  for (let i = nodeRow + 4; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().length === 0) continue;
    
    if (line.trim().match(/^[\d\.]+$/)) {
      continue;
    }

    let timeStr = line.substring(Math.max(0, timeMatches[0].index! - 5), timeMatches[0].index! + 10).trim();
    const timeVal = parseFloat(timeStr);
    if (isNaN(timeVal)) continue;

    for (const col of dataColumns) {
       if (!col.node) continue;
       
       const start = Math.max(0, col.center - 8);
       const end = Math.min(line.length, col.center + 8);
       const valStr = line.substring(start, end).trim();
       
       if (valStr) {
         const val = parseFloat(valStr);
         if (!isNaN(val)) {
           data.push({
             time: timeVal,
             node: col.node,
             variable: col.variable,
             value: val
           });
           nodesSet.add(col.node);
           variablesSet.add(col.variable);
         }
       }
    }
  }

  const timeSet = new Set<number>();
  data.forEach(d => timeSet.add(d.time));
  const timeArray = Array.from(timeSet).sort((a,b) => a-b);
  const timeRange: [number, number] = [timeArray[0] || 0, timeArray[timeArray.length-1] || 0];

  return {
    metadata: {
      projectName,
      runDate,
      runTime,
      nodeCount: nodesSet.size,
      timeRange,
      timestepAvg: timeArray.length > 1 ? (timeArray[1] - timeArray[0]) : 0,
      totalRecords: data.length,
      nodes: Array.from(nodesSet),
      variables: Array.from(variablesSet)
    },
    data
  };
}
