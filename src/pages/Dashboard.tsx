import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface DbEntry {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

interface Entry {
  id: string;
  date: string;
  amount: number;
  type: 'sales' | 'delivery';
  category: 'Training' | 'Coaching' | 'Speaking';
}

const Dashboard = () => {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['entries'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('entries')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Error fetching entries:', error);
        throw error;
      }
      
      return (data as DbEntry[]).map(entry => ({
        id: entry.id,
        date: entry.date,
        amount: parseFloat(entry.content || '0'),
        type: entry.title.toLowerCase().includes('sales') ? 'sales' as const : 'delivery' as const,
        category: (entry.title.includes('Training') ? 'Training' : 
                  entry.title.includes('Coaching') ? 'Coaching' : 'Speaking') as 'Training' | 'Coaching' | 'Speaking'
      }));
    },
  });
  const [pieChartType, setPieChartType] = useState<'sales' | 'delivery'>('sales');
  const [pieChartRange, setPieChartRange] = useState('last-3-months');

  const colors = {
    Training: '#10B981',
    Coaching: '#3B82F6', 
    Speaking: '#EF4444'
  };

  // Generate monthly data for the last 12 months
  const getLast12Months = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      months.push({
        month: monthName,
        monthKey,
        Training: 0,
        Coaching: 0,
        Speaking: 0
      });
    }
    
    return months;
  };

  const getMonthlyData = (type: 'sales' | 'delivery') => {
    const monthlyData = getLast12Months();
    
    entries
      .filter(entry => entry.type === type)
      .forEach(entry => {
        const entryDate = new Date(entry.date);
        const monthKey = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;
        
        const monthData = monthlyData.find(m => m.monthKey === monthKey);
        if (monthData) {
          monthData[entry.category] += entry.amount;
        }
      });

    return monthlyData;
  };

  const getPieChartData = () => {
    const filteredEntries = entries.filter(entry => entry.type === pieChartType);
    const categoryTotals = filteredEntries.reduce((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + entry.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      name: category,
      value: amount,
      color: colors[category as keyof typeof colors]
    }));
  };

  const calculateStats = (data: any[], category: string) => {
    const values = data.map(d => d[category]).filter(v => v > 0);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = values.length > 0 ? total / values.length : 0;
    const runningRate = data.slice(-12).reduce((sum, d) => sum + d[category], 0) / 12;

    return { total, average, runningRate };
  };

  const salesData = getMonthlyData('sales');
  const deliveryData = getMonthlyData('delivery');
  const pieData = getPieChartData();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Performance Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive view of your sales and delivery performance</p>
        </div>

        {/* Monthly Totals Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sales">Monthly Sales Totals</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                  <Bar dataKey="Training" fill={colors.Training} />
                  <Bar dataKey="Coaching" fill={colors.Coaching} />
                  <Bar dataKey="Speaking" fill={colors.Speaking} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-delivery">Monthly Delivery Totals</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deliveryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                  <Bar dataKey="Training" fill={colors.Training} />
                  <Bar dataKey="Coaching" fill={colors.Coaching} />
                  <Bar dataKey="Speaking" fill={colors.Speaking} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Pie Chart Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
            <div className="flex gap-4">
              <Select value={pieChartType} onValueChange={(value: 'sales' | 'delivery') => setPieChartType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={pieChartRange} onValueChange={setPieChartRange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                  <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                  <SelectItem value="last-12-months">Last 12 Months</SelectItem>
                  <SelectItem value="all-time">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 12-Month Analysis Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sales">Last 12 Months - Sales Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Month</th>
                      <th className="text-right p-2">Training</th>
                      <th className="text-right p-2">Coaching</th>
                      <th className="text-right p-2">Speaking</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.slice(-12).reverse().map((month, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{month.month}</td>
                        <td className="text-right p-2">${month.Training.toLocaleString()}</td>
                        <td className="text-right p-2">${month.Coaching.toLocaleString()}</td>
                        <td className="text-right p-2">${month.Speaking.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 font-semibold">
                    <tr>
                      <td className="p-2">Total</td>
                      <td className="text-right p-2">${calculateStats(salesData, 'Training').total.toLocaleString()}</td>
                      <td className="text-right p-2">${calculateStats(salesData, 'Coaching').total.toLocaleString()}</td>
                      <td className="text-right p-2">${calculateStats(salesData, 'Speaking').total.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="p-2">Average</td>
                      <td className="text-right p-2">${Math.round(calculateStats(salesData, 'Training').average).toLocaleString()}</td>
                      <td className="text-right p-2">${Math.round(calculateStats(salesData, 'Coaching').average).toLocaleString()}</td>
                      <td className="text-right p-2">${Math.round(calculateStats(salesData, 'Speaking').average).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="p-2">Running Rate</td>
                      <td className="text-right p-2">${Math.round(calculateStats(salesData, 'Training').runningRate).toLocaleString()}</td>
                      <td className="text-right p-2">${Math.round(calculateStats(salesData, 'Coaching').runningRate).toLocaleString()}</td>
                      <td className="text-right p-2">${Math.round(calculateStats(salesData, 'Speaking').runningRate).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-delivery">Last 12 Months - Delivery Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Month</th>
                      <th className="text-right p-2">Training</th>
                      <th className="text-right p-2">Coaching</th>
                      <th className="text-right p-2">Speaking</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryData.slice(-12).reverse().map((month, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{month.month}</td>
                        <td className="text-right p-2">${month.Training.toLocaleString()}</td>
                        <td className="text-right p-2">${month.Coaching.toLocaleString()}</td>
                        <td className="text-right p-2">${month.Speaking.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 font-semibold">
                    <tr>
                      <td className="p-2">Total</td>
                      <td className="text-right p-2">${calculateStats(deliveryData, 'Training').total.toLocaleString()}</td>
                      <td className="text-right p-2">${calculateStats(deliveryData, 'Coaching').total.toLocaleString()}</td>
                      <td className="text-right p-2">${calculateStats(deliveryData, 'Speaking').total.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="p-2">Average</td>
                      <td className="text-right p-2">${Math.round(calculateStats(deliveryData, 'Training').average).toLocaleString()}</td>
                      <td className="text-right p-2">${Math.round(calculateStats(deliveryData, 'Coaching').average).toLocaleString()}</td>
                      <td className="text-right p-2">${Math.round(calculateStats(deliveryData, 'Speaking').average).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="p-2">Running Rate</td>
                      <td className="text-right p-2">${Math.round(calculateStats(deliveryData, 'Training').runningRate).toLocaleString()}</td>
                      <td className="text-right p-2">${Math.round(calculateStats(deliveryData, 'Coaching').runningRate).toLocaleString()}</td>
                      <td className="text-right p-2">${Math.round(calculateStats(deliveryData, 'Speaking').runningRate).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;