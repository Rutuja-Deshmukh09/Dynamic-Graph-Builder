import { useState } from "react";
import { useParams } from "wouter";
import { Search, ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react";

import { DashboardLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import { useTableData, useNodes, useVariables } from "@/hooks/use-simulation";

export default function DataTable() {
  const params = useParams();
  const sessionId = params.session_id as string;

  const [page, setPage] = useState(1);
  const limit = 50;

  const [nodeFilter, setNodeFilter] = useState<string>("all");
  const [varFilter, setVarFilter] = useState<string>("all");

  const { data: nodes } = useNodes(sessionId);
  const { data: variables } = useVariables(sessionId);

  const { data, isLoading, isFetching } = useTableData(
    sessionId, 
    page, 
    limit, 
    nodeFilter === "all" ? undefined : nodeFilter,
    varFilter === "all" ? undefined : varFilter
  );

  const handleNodeChange = (v: string) => {
    setNodeFilter(v);
    setPage(1); // Reset pagination on filter change
  };

  const handleVarChange = (v: string) => {
    setVarFilter(v);
    setPage(1);
  };

  return (
    <DashboardLayout sessionId={sessionId}>
      <div className="max-w-7xl mx-auto space-y-6 h-[calc(100vh-8rem)] flex flex-col pb-4">
        
        <Card className="shrink-0 border-border/50 shadow-lg shadow-black/10">
          <CardHeader className="py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="font-display flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Tabular Data Explorer
              </CardTitle>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-background border border-border rounded-md px-3 py-1.5 h-10 w-full md:w-[250px]">
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">Filters applied via DB</span>
                </div>

                <Select value={nodeFilter} onValueChange={handleNodeChange}>
                  <SelectTrigger className="w-[140px] font-mono h-10">
                    <SelectValue placeholder="All Nodes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-mono text-muted-foreground">All Nodes</SelectItem>
                    {nodes?.map(n => <SelectItem key={n} value={n} className="font-mono">{n}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={varFilter} onValueChange={handleVarChange}>
                  <SelectTrigger className="w-[140px] font-mono h-10">
                    <SelectValue placeholder="All Variables" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-mono text-muted-foreground">All Variables</SelectItem>
                    {variables?.map(v => <SelectItem key={v} value={v} className="font-mono">{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="flex-1 flex flex-col overflow-hidden border-border/50 shadow-xl shadow-black/20">
          <div className="flex-1 overflow-auto relative">
            <Table>
              <TableHeader className="bg-card sticky top-0 z-20 shadow-sm border-b border-border">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[100px]">Time (s)</TableHead>
                  <TableHead className="w-[150px]">Node</TableHead>
                  <TableHead>Variable</TableHead>
                  <TableHead className="text-right">PLT Value</TableHead>
                  <TableHead className="text-right">TAB Value</TableHead>
                  <TableHead className="text-right">Difference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({length: 15}).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : data?.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                      No records found for the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data.map((row, i) => (
                    <TableRow key={i} className="hover:bg-primary/5 transition-colors group">
                      <TableCell className="font-mono text-xs text-muted-foreground">{row.time}</TableCell>
                      <TableCell className="font-mono text-xs font-bold text-primary">{row.node}</TableCell>
                      <TableCell className="font-mono text-xs">{row.variable}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-cyan-200">
                        {row.pltValue !== null ? row.pltValue.toExponential(4) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-purple-200">
                        {row.tabValue !== null ? row.tabValue.toExponential(4) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {row.diff !== null ? (
                          <span className={row.diff > 0.001 ? "text-red-400 font-bold" : "text-emerald-400"}>
                            {row.diff.toExponential(4)}
                          </span>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {/* Loading overlay for fetching next pages */}
            {isFetching && !isLoading && (
              <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px] flex items-center justify-center z-10 pointer-events-none">
                <div className="bg-card border border-border px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <span className="text-sm font-medium">Loading records...</span>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-border bg-card p-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground font-mono">
              Showing <span className="text-foreground">{data ? ((page - 1) * limit + 1) : 0}</span> to <span className="text-foreground">{data ? Math.min(page * limit, data.total) : 0}</span> of <span className="text-foreground">{data?.total || 0}</span> records
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="hover-elevate"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <div className="text-sm font-mono px-4 py-1.5 bg-background border border-border rounded-md">
                Page {page} / {data?.totalPages || 1}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => p + 1)}
                disabled={page === (data?.totalPages || 1) || isLoading}
                className="hover-elevate"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>

      </div>
    </DashboardLayout>
  );
}
