import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CalendarIcon, Plus, Edit, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const METRIC_TYPES = ['Calls', 'Emails', 'Coffees', 'Meetings', 'Proposals', 'Pitches'];

interface Metric {
  id: string;
  user_id: string;
  date: string;
  metric_type: string;
  count: number;
  created_at: string;
  updated_at: string;
}

export const MetricsTracker = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingMetric, setEditingMetric] = useState<Partial<Metric>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch today's metrics for chart
  const { data: todayMetrics = [] } = useQuery({
    queryKey: ['metrics', 'today', format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      const todayString = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('metrics')
        .select('*')
        .eq('date', todayString);
      
      if (error) {
        console.error('Error fetching metrics:', error);
        throw error;
      }
      
      return data as Metric[];
    },
  });

  // Fetch all metrics for the table
  const { data: allMetrics = [] } = useQuery({
    queryKey: ['metrics', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metrics')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Error fetching all metrics:', error);
        throw error;
      }
      
      return data as Metric[];
    },
  });

  // Aggregate metrics by type for today's chart
  const chartData = METRIC_TYPES.map(type => {
    const total = todayMetrics
      .filter(m => m.metric_type === type)
      .reduce((sum, m) => sum + m.count, 0);
    return {
      name: type,
      count: total
    };
  });

  const addMetric = async () => {
    if (!selectedMetric) {
      toast({
        title: "Select a metric",
        description: "Please select a metric type before adding.",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to track metrics.",
        variant: "destructive",
      });
      return;
    }

    const dateString = format(selectedDate, 'yyyy-MM-dd');

    // Check if entry exists for this date and metric
    const { data: existing } = await supabase
      .from('metrics')
      .select('*')
      .eq('date', dateString)
      .eq('metric_type', selectedMetric)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      // Update existing entry
      const { error } = await supabase
        .from('metrics')
        .update({ count: existing.count + 1 })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating metric:', error);
        toast({
          title: "Error",
          description: "Failed to update metric.",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Create new entry
      const { error } = await supabase
        .from('metrics')
        .insert({
          user_id: user.id,
          date: dateString,
          metric_type: selectedMetric,
          count: 1
        });

      if (error) {
        console.error('Error creating metric:', error);
        toast({
          title: "Error",
          description: "Failed to add metric.",
          variant: "destructive",
        });
        return;
      }
    }

    queryClient.invalidateQueries({ queryKey: ['metrics'] });
    toast({
      title: "Metric Added",
      description: `Added 1 ${selectedMetric} for ${format(selectedDate, 'MMM d, yyyy')}`,
    });
  };

  const startEdit = (metric: Metric) => {
    setEditingId(metric.id);
    setEditingMetric({ ...metric });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingMetric({});
  };

  const saveEdit = async () => {
    if (!editingId || !editingMetric) return;

    const { error } = await supabase
      .from('metrics')
      .update({
        date: editingMetric.date,
        metric_type: editingMetric.metric_type,
        count: editingMetric.count
      })
      .eq('id', editingId);

    if (error) {
      console.error('Error updating metric:', error);
      toast({
        title: "Error",
        description: "Failed to update metric.",
        variant: "destructive",
      });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['metrics'] });
    setEditingId(null);
    setEditingMetric({});
    toast({
      title: "Metric Updated",
      description: "The metric has been successfully updated.",
    });
  };

  const deleteMetric = async (id: string) => {
    const { error } = await supabase
      .from('metrics')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting metric:', error);
      toast({
        title: "Error",
        description: "Failed to delete metric.",
        variant: "destructive",
      });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['metrics'] });
    toast({
      title: "Metric Deleted",
      description: "The metric has been deleted.",
    });
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d, yyyy');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Track Lead Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Metric Type</label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger>
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  {METRIC_TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={addMetric} className="px-6">
              <Plus className="h-4 w-4 mr-2" />
              Add Count
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today's Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Metrics Data</CardTitle>
        </CardHeader>
        <CardContent>
          {allMetrics.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No metrics recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Metric Type</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allMetrics.map((metric) => (
                  <TableRow key={metric.id}>
                    <TableCell>
                      {editingId === metric.id ? (
                        <Input
                          type="date"
                          value={editingMetric.date || ''}
                          onChange={(e) => setEditingMetric(prev => ({ ...prev, date: e.target.value }))}
                          className="w-48"
                        />
                      ) : (
                        formatDate(metric.date)
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {editingId === metric.id ? (
                        <Select 
                          value={editingMetric.metric_type || ''} 
                          onValueChange={(value) => setEditingMetric(prev => ({ ...prev, metric_type: value }))}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {METRIC_TYPES.map(type => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        metric.metric_type
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {editingId === metric.id ? (
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={editingMetric.count || 0}
                          onChange={(e) => setEditingMetric(prev => ({ ...prev, count: parseInt(e.target.value) || 0 }))}
                          className="w-24"
                        />
                      ) : (
                        metric.count
                      )}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      {editingId === metric.id ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={saveEdit}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => startEdit(metric)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => deleteMetric(metric.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
