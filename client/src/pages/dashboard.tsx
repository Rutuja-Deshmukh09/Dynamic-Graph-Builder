import { useState, useEffect } from "react";
import { useParams } from "wouter";
import Plot from "react-plotly.js";
import { CheckCircle2, AlertTriangle, XCircle, Clock, Database, GitMerge, FileSpreadsheet, Settings2 } from "lucide-react";

import { DashboardLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";

import { useMetadata, useNodes, useVariables, useValidation, useTimeseries, useSnapshot } from "@/hooks/use-simulation";

export default function Dashboard() {
  const params = useParams();
  const sessionId = params.session_id as string;

  // Global Metadata
  const { data: metadata, isLoading: metadataLoading } = useMetadata(sessionId);
  const { data: nodes, isLoading: nodesLoading } = useNodes(sessionId);
  const { data: variables, isLoading: varsLoading } = useVariables(sessionId);
  const { data: validation, isLoading: validLoading } = useValidation(sessionId);

  // Chart A States: Time History
  const [chartANode, setChartANode] = useState<string>("");
  const [chartAVar, setChartAVar] = useState<string>("");
  const [chartASource, setChartASource] = useState<"both" | "plt" | "tab">("both");

  // Chart B States: Snapshot
  const [chartBTime, setChartBTime] = useState<number>(0);
  const [chartBVar, setChartBVar] = useState<string>("");
  const [chartBSource, setChartBSource] = useState<"plt" | "tab">("plt");

  // Chart C States: Comparison
  const [chartCNode, setChartCNode] = useState<string>("");
  const [chartCVar, setChartCVar] = useState<string>("");

  // Initialize dropdowns when data loads
  useEffect(() => {
    if (nodes?.length && !chartANode) {
      setChartANode(nodes[0]);
      setChartCNode(nodes[0]);
    }
    if (variables?.length && !chartAVar) {
      setChartAVar(variables[0]);
      setChartBVar(variables[0]);
      setChartCVar(variables[0]);
    }
    if (metadata && chartBTime === 0) {
      setChartBTime(metadata.timeRange[0]);
    }
  }, [nodes, variables, metadata]);

  // Queries for charts
  const { data: tsDataA, isLoading: tsLoadingA } = useTimeseries(
    sessionId, 
    chartANode ? [chartANode] : [], 
    chartAVar, 
    chartASource
  );

  const { data: snapData, isLoading: snapLoading } = useSnapshot(
    sessionId,
    chartBTime.toString(),
    chartBVar,
    chartBSource
  );

  const { data: tsDataC, isLoading: tsLoadingC } = useTimeseries(
    sessionId,
    chartCNode ? [chartCNode] : [],
    chartCVar,
    "both"
  );

  // Loading States
  const isGlobalLoading = metadataLoading || nodesLoading || varsLoading || validLoading;

  if (isGlobalLoading) {
    return (
      <DashboardLayout sessionId={sessionId}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl bg-card" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[500px] lg:col-span-2 rounded-xl bg-card" />
            <Skeleton className="h-[500px] rounded-xl bg-card" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Formatting Plotly Data
  const getPlotlyTheme = () => ({
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { family: 'JetBrains Mono', color: 'hsl(215 20% 65%)' },
    margin: { t: 40, r: 20, l: 50, b: 40 },
    xaxis: { gridcolor: 'hsl(216 34% 17%)', zerolinecolor: 'hsl(216 34% 20%)' },
    yaxis: { gridcolor: 'hsl(216 34% 17%)', zerolinecolor: 'hsl(216 34% 20%)' },
    legend: { orientation: 'h', y: -0.2 } as const,
  });

  // Chart A Trace Generation
  const tracesA: any[] = [];
  if (tsDataA && chartANode && tsDataA[chartANode]) {
    const nodeData = tsDataA[chartANode];
    if (nodeData.plt && (chartASource === 'both' || chartASource === 'plt')) {
      tracesA.push({
        x: nodeData.plt.map(d => d.time),
        y: nodeData.plt.map(d => d.value),
        name: `${chartANode} (PLT)`,
        type: 'scatter',
        mode: 'lines',
        line: { color: 'hsl(199 89% 48%)', width: 2 }
      });
    }
    if (nodeData.tab && (chartASource === 'both' || chartASource === 'tab')) {
      tracesA.push({
        x: nodeData.tab.map(d => d.time),
        y: nodeData.tab.map(d => d.value),
        name: `${chartANode} (TAB)`,
        type: 'scatter',
        mode: 'lines',
        line: { color: 'hsl(280 85% 65%)', width: 2, dash: 'dash' }
      });
    }
  }

  // Chart B Trace Generation
  const tracesB: any[] = [];
  if (snapData && snapData.length > 0) {
    tracesB.push({
      x: snapData.map(d => d.node),
      y: snapData.map(d => d.value),
      type: 'bar',
      marker: { color: chartBSource === 'plt' ? 'hsl(199 89% 48%)' : 'hsl(280 85% 65%)' },
      name: `${chartBVar} at t=${chartBTime}`,
    });
  }

  // Chart C Trace Generation
  const tracesC: any[] = [];
  if (tsDataC && chartCNode && tsDataC[chartCNode]) {
    const nodeData = tsDataC[chartCNode];
    if (nodeData.plt) {
      tracesC.push({
        x: nodeData.plt.map(d => d.time),
        y: nodeData.plt.map(d => d.value),
        name: `PLT`,
        type: 'scatter',
        mode: 'lines',
        line: { color: 'hsl(199 89% 48%)', width: 1.5 }
      });
    }
    if (nodeData.tab) {
      tracesC.push({
        x: nodeData.tab.map(d => d.time),
        y: nodeData.tab.map(d => d.value),
        name: `TAB`,
        type: 'scatter',
        mode: 'lines',
        line: { color: 'hsl(280 85% 65%)', width: 1.5 }
      });
    }
    if (nodeData.plt && nodeData.tab) {
      // Create diff array
      const diffY = nodeData.plt.map((p, i) => {
        const t = nodeData.tab?.find(tabD => tabD.time === p.time);
        if (t && p.value !== null && t.value !== null) {
          return Math.abs(p.value - t.value);
        }
        return null;
      });
      tracesC.push({
        x: nodeData.plt.map(d => d.time),
        y: diffY,
        name: `Abs Diff`,
        type: 'scatter',
        mode: 'lines',
        yaxis: 'y2',
        line: { color: 'hsl(0 63% 50%)', width: 1.5, dash: 'dot' }
      });
    }
  }


  return (
    <DashboardLayout sessionId={sessionId}>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        
        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Project Name" value={metadata?.projectName || "Unknown"} icon={Database} />
          <KpiCard title="Simulation Nodes" value={metadata?.nodeCount.toString() || "0"} icon={GitMerge} />
          <KpiCard title="Total Records" value={metadata?.totalRecords.toLocaleString() || "0"} icon={FileSpreadsheet} />
          <KpiCard title="Time Range" value={`${metadata?.timeRange[0]}s - ${metadata?.timeRange[1]}s`} icon={Clock} />
        </div>

        {/* Validation Section */}
        {validation && (
          <Card className={`border-l-4 ${
            validation.overallStatus === 'pass' ? 'border-l-emerald-500' :
            validation.overallStatus === 'warn' ? 'border-l-amber-500' : 'border-l-red-500'
          }`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-muted-foreground" />
                  Data Validation & Integrity
                </CardTitle>
                <Badge variant={
                  validation.overallStatus === 'pass' ? 'default' :
                  validation.overallStatus === 'warn' ? 'secondary' : 'destructive'
                } className={`
                  ${validation.overallStatus === 'pass' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : ''}
                  ${validation.overallStatus === 'warn' ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : ''}
                `}>
                  {validation.overallStatus.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-background/50 p-2 rounded-md border border-border">
                    <span className="text-sm text-muted-foreground">Record Count Match</span>
                    {validation.recordCountMatch ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-destructive" />}
                  </div>
                  <div className="flex justify-between items-center bg-background/50 p-2 rounded-md border border-border">
                    <span className="text-sm text-muted-foreground">Time Vector Match</span>
                    {validation.timeVectorMatch ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-destructive" />}
                  </div>
                  <div className="flex justify-between items-center bg-background/50 p-2 rounded-md border border-border">
                    <span className="text-sm text-muted-foreground">Max Time Diff</span>
                    <span className="font-mono text-sm">{validation.maxTimeDiff.toFixed(6)}s</span>
                  </div>
                </div>
                
                <div className="md:col-span-2 max-h-[140px] overflow-y-auto rounded-md border border-border">
                  <Table className="text-xs">
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        <TableHead>Node</TableHead>
                        <TableHead>Variable</TableHead>
                        <TableHead>Max Diff</TableHead>
                        <TableHead>MAE</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validation.nodeValidation.map((nv, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono">{nv.node}</TableCell>
                          <TableCell className="font-mono">{nv.variable}</TableCell>
                          <TableCell className="font-mono text-amber-400">{nv.maxDiff.toExponential(2)}</TableCell>
                          <TableCell className="font-mono text-cyan-400">{nv.mae.toExponential(2)}</TableCell>
                          <TableCell>
                            {nv.status === 'pass' && <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-[10px] h-5">PASS</Badge>}
                            {nv.status === 'warn' && <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-[10px] h-5">WARN</Badge>}
                            {nv.status === 'fail' && <Badge variant="destructive" className="text-[10px] h-5">FAIL</Badge>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart A: Time History */}
          <Card className="lg:col-span-2 shadow-lg shadow-black/20">
            <CardHeader className="bg-card border-b border-border pb-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle className="font-display">Time History Analysis</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={chartANode} onValueChange={setChartANode}>
                    <SelectTrigger className="w-[140px] h-8 text-xs font-mono">
                      <SelectValue placeholder="Select Node" />
                    </SelectTrigger>
                    <SelectContent>
                      {nodes?.map(n => <SelectItem key={n} value={n} className="font-mono">{n}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={chartAVar} onValueChange={setChartAVar}>
                    <SelectTrigger className="w-[140px] h-8 text-xs font-mono">
                      <SelectValue placeholder="Select Variable" />
                    </SelectTrigger>
                    <SelectContent>
                      {variables?.map(v => <SelectItem key={v} value={v} className="font-mono">{v}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Tabs value={chartASource} onValueChange={(v: any) => setChartASource(v)} className="w-[180px]">
                    <TabsList className="h-8 w-full">
                      <TabsTrigger value="both" className="text-xs flex-1">Both</TabsTrigger>
                      <TabsTrigger value="plt" className="text-xs flex-1">PLT</TabsTrigger>
                      <TabsTrigger value="tab" className="text-xs flex-1">TAB</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[400px] w-full p-2 relative">
                {tsLoadingA ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                    <Skeleton className="h-[80%] w-[90%] rounded-xl" />
                  </div>
                ) : null}
                <Plot
                  data={tracesA}
                  layout={{
                    ...getPlotlyTheme(),
                    title: '',
                    xaxis: { ...getPlotlyTheme().xaxis, title: 'Time (s)' },
                    yaxis: { ...getPlotlyTheme().yaxis, title: chartAVar },
                    autosize: true
                  }}
                  useResizeHandler={true}
                  style={{ width: '100%', height: '100%' }}
                  config={{ responsive: true, displayModeBar: false }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Chart B: Snapshot */}
          <Card className="shadow-lg shadow-black/20">
            <CardHeader className="bg-card border-b border-border pb-4">
              <div className="flex flex-col gap-4">
                <CardTitle className="font-display">Node Profile Snapshot</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={chartBVar} onValueChange={setChartBVar}>
                    <SelectTrigger className="w-full h-8 text-xs font-mono">
                      <SelectValue placeholder="Variable" />
                    </SelectTrigger>
                    <SelectContent>
                      {variables?.map(v => <SelectItem key={v} value={v} className="font-mono">{v}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={chartBSource} onValueChange={(v: any) => setChartBSource(v)}>
                    <SelectTrigger className="w-[100px] h-8 text-xs font-mono">
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plt" className="font-mono">PLT</SelectItem>
                      <SelectItem value="tab" className="font-mono">TAB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {metadata && (
                  <div className="flex items-center gap-4 px-2">
                    <span className="text-xs font-mono text-muted-foreground w-16">t={chartBTime}s</span>
                    <Slider 
                      defaultValue={[metadata.timeRange[0]]} 
                      max={metadata.timeRange[1]} 
                      min={metadata.timeRange[0]} 
                      step={metadata.timestepAvg || 1}
                      onValueChange={(v) => setChartBTime(v[0])}
                      className="flex-1"
                    />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[350px] w-full p-2 relative">
                 {snapLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10"><Loader2 className="animate-spin text-primary" /></div>
                ) : null}
                <Plot
                  data={tracesB}
                  layout={{
                    ...getPlotlyTheme(),
                    xaxis: { ...getPlotlyTheme().xaxis, title: 'Nodes', type: 'category' },
                    yaxis: { ...getPlotlyTheme().yaxis, title: chartBVar },
                    autosize: true
                  }}
                  useResizeHandler={true}
                  style={{ width: '100%', height: '100%' }}
                  config={{ responsive: true, displayModeBar: false }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Chart C: Comparison & Diff */}
          <Card className="shadow-lg shadow-black/20">
             <CardHeader className="bg-card border-b border-border pb-4">
              <div className="flex justify-between items-center gap-4">
                <CardTitle className="font-display">Delta Analysis</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={chartCNode} onValueChange={setChartCNode}>
                    <SelectTrigger className="w-[100px] h-8 text-xs font-mono">
                      <SelectValue placeholder="Node" />
                    </SelectTrigger>
                    <SelectContent>
                      {nodes?.map(n => <SelectItem key={n} value={n} className="font-mono">{n}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={chartCVar} onValueChange={setChartCVar}>
                    <SelectTrigger className="w-[120px] h-8 text-xs font-mono">
                      <SelectValue placeholder="Variable" />
                    </SelectTrigger>
                    <SelectContent>
                      {variables?.map(v => <SelectItem key={v} value={v} className="font-mono">{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[350px] w-full p-2 relative">
                {tsLoadingC ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10"><Loader2 className="animate-spin text-primary" /></div>
                ) : null}
                <Plot
                  data={tracesC}
                  layout={{
                    ...getPlotlyTheme(),
                    xaxis: { ...getPlotlyTheme().xaxis, title: 'Time (s)' },
                    yaxis: { ...getPlotlyTheme().yaxis, title: chartCVar },
                    yaxis2: { 
                      title: 'Abs Diff', 
                      overlaying: 'y', 
                      side: 'right',
                      gridcolor: 'transparent',
                      zerolinecolor: 'transparent',
                      tickfont: { color: 'hsl(0 63% 50%)' }
                    },
                    autosize: true
                  }}
                  useResizeHandler={true}
                  style={{ width: '100%', height: '100%' }}
                  config={{ responsive: true, displayModeBar: false }}
                />
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}

function KpiCard({ title, value, icon: Icon }: { title: string, value: string | number, icon: any }) {
  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 shadow-md">
      <CardContent className="p-6 flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold font-mono text-foreground mt-1 truncate">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}
