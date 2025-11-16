import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch today's metrics
  const { data: todayMetrics = [] } = useQuery({
    queryKey: ['metrics', format(new Date(), 'yyyy-MM-dd')],
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
    </div>
  );
};
