
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MetricsTracker } from "@/components/MetricsTracker";

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
  type: 'sales' | 'delivery' | 'events';
  category: 'Training' | 'Coaching' | 'Speaking' | 'Tickets' | 'Workshops' | 'Buskouts';
  title: string;
  content?: string;
  user_id: string;
}

interface DayData {
  sales: number;
  delivery: number;
  events: number;
}

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isGrossView, setIsGrossView] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Convert amount based on gross/net view
  const convertAmount = (amount: number) => {
    return isGrossView ? amount * 1.66 : amount;
  };

  // Fetch entries from Supabase
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
      
      return (data as DbEntry[]).map(entry => {
        const title = entry.title.toLowerCase();
        let type: 'sales' | 'delivery' | 'events';
        if (title.includes('sales')) {
          type = 'sales';
        } else if (title.includes('events')) {
          type = 'events';
        } else {
          type = 'delivery';
        }
        
        return {
          id: entry.id,
          date: entry.date,
          amount: parseFloat(entry.content || '0'),
          type,
          category: entry.title.split(' - ')[1] as any || 'Training',
          title: entry.title,
          content: entry.content,
          user_id: entry.user_id
        };
      });
    },
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const categories = ['Training', 'Coaching', 'Speaking'];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getDateString = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getDayData = (day: number): DayData => {
    const dateString = getDateString(day);
    const dayEntries = entries.filter(entry => entry.date === dateString);
    
    return {
      sales: dayEntries.filter(e => e.type === 'sales').reduce((sum, e) => sum + e.amount, 0),
      delivery: dayEntries.filter(e => e.type === 'delivery').reduce((sum, e) => sum + e.amount, 0),
      events: dayEntries.filter(e => e.type === 'events').reduce((sum, e) => sum + e.amount, 0)
    };
  };

  const getWeekData = (weekStart: number): DayData => {
    let sales = 0;
    let delivery = 0;
    let events = 0;
    
    for (let i = 0; i < 7; i++) {
      const day = weekStart + i;
      if (day > 0 && day <= getDaysInMonth(currentDate)) {
        const dayData = getDayData(day);
        sales += dayData.sales;
        delivery += dayData.delivery;
        events += dayData.events;
      }
    }
    
    return { sales, delivery, events };
  };

  const getMonthTotals = (): DayData => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getFullYear() === year && entryDate.getMonth() === month;
    });

    return {
      sales: monthEntries.filter(e => e.type === 'sales').reduce((sum, e) => sum + e.amount, 0),
      delivery: monthEntries.filter(e => e.type === 'delivery').reduce((sum, e) => sum + e.amount, 0),
      events: monthEntries.filter(e => e.type === 'events').reduce((sum, e) => sum + e.amount, 0)
    };
  };

  const addEntry = async (day: number, amount: number, type: 'sales' | 'delivery' | 'events', category: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add entries",
        variant: "destructive",
      });
      return;
    }

    const dateString = getDateString(day);
    const titlePrefix = type === 'sales' ? 'Sales' : type === 'events' ? 'Events' : 'Delivery';
    const title = `${titlePrefix} - ${category}`;
    
    const { error } = await (supabase as any)
      .from('entries')
      .insert({
        date: dateString,
        title,
        content: amount.toString(),
        user_id: user.id
      });

    if (error) {
      console.error('Error adding entry:', error);
      toast({
        title: "Error",
        description: "Failed to add entry",
        variant: "destructive",
      });
      return;
    }

    // Refresh the entries
    queryClient.invalidateQueries({ queryKey: ['entries'] });
    
    const typeLabel = type === 'sales' ? 'Sales' : type === 'events' ? 'Events' : 'Delivery';
    toast({
      title: "Entry Added",
      description: `${typeLabel} of $${amount} added for ${category}`,
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const selectMonth = (monthIndex: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(monthIndex);
      return newDate;
    });
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthTotals = getMonthTotals();

  const renderCalendarDays = () => {
    const days = [];
    const totalCells = Math.ceil((daysInMonth + firstDay) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const day = i - firstDay + 1;
      const isValidDay = day > 0 && day <= daysInMonth;
      
      if (isValidDay) {
        const dayData = getDayData(day);
        days.push(
          <DayCell
            key={i}
            day={day}
            data={dayData}
            onAddEntry={addEntry}
            isGrossView={isGrossView}
          />
        );
      } else {
        days.push(<div key={i} className="h-40"></div>);
      }
    }

    return days;
  };

  const renderWeekTotals = () => {
    const weeks = [];
    const totalCells = Math.ceil((daysInMonth + firstDay) / 7) * 7;
    
    for (let week = 0; week < totalCells / 7; week++) {
      const weekStart = week * 7 - firstDay + 1;
      const weekData = getWeekData(weekStart);
      
      weeks.push(
        <Card key={week} className="p-4 bg-performance-light">
          <div className="text-sm font-medium text-center mb-2">Week {week + 1}</div>
          <div className="space-y-1">
            <div className="text-sales font-semibold">${convertAmount(weekData.sales).toLocaleString()}</div>
            <div className="text-delivery font-semibold">${convertAmount(weekData.delivery).toLocaleString()}</div>
            <div className="text-accent font-semibold">${convertAmount(weekData.events).toLocaleString()}</div>
          </div>
        </Card>
      );
    }

    return weeks;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading calendar...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Switch 
              id="gross-net-toggle" 
              checked={isGrossView} 
              onCheckedChange={setIsGrossView}
            />
            <Label htmlFor="gross-net-toggle" className="text-sm font-medium">
              {isGrossView ? 'Gross' : 'Net'}
            </Label>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Select onValueChange={(value) => selectMonth(parseInt(value))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={months[currentDate.getMonth()]} />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={month} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-sales">${convertAmount(monthTotals.sales).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Sales Total</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-delivery">${convertAmount(monthTotals.delivery).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Delivery Total</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-accent">${convertAmount(monthTotals.events).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Events Total</div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {renderCalendarDays()}
            </div>
          </div>

          {/* Weekly Totals */}
          <div className="w-32 space-y-1">
            <div className="p-2 text-center font-medium text-muted-foreground mb-4">
              Weekly
            </div>
            {renderWeekTotals()}
          </div>
        </div>

        {/* Lead Metrics Section */}
        <div className="mt-8">
          <MetricsTracker />
        </div>
      </div>
    </div>
  );
};

interface DayCellProps {
  day: number;
  data: DayData;
  onAddEntry: (day: number, amount: number, type: 'sales' | 'delivery' | 'events', category: string) => void;
  isGrossView: boolean;
}

const DayCell = ({ day, data, onAddEntry, isGrossView }: DayCellProps) => {
  const [cashAmount, setCashAmount] = useState('');
  const [showCashTypeSelect, setShowCashTypeSelect] = useState(false);
  const [cashSelectedType, setCashSelectedType] = useState<'sales' | 'delivery' | null>(null);
  const [showCashCategoryMenu, setShowCashCategoryMenu] = useState(false);
  
  const [eventsAmount, setEventsAmount] = useState('');
  const [showEventsCategoryMenu, setShowEventsCategoryMenu] = useState(false);
  
  const convertAmount = (amount: number) => {
    return isGrossView ? amount * 1.66 : amount;
  };

  const handleCashAmountSubmit = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0) {
      setShowCashTypeSelect(true);
    }
  };

  const handleCashTypeSelect = (type: 'sales' | 'delivery') => {
    setCashSelectedType(type);
    setShowCashTypeSelect(false);
    setShowCashCategoryMenu(true);
  };

  const handleCashCategorySelect = (category: string) => {
    if (cashSelectedType) {
      const amount = parseFloat(cashAmount);
      onAddEntry(day, amount, cashSelectedType, category);
      setCashAmount('');
      setCashSelectedType(null);
      setShowCashCategoryMenu(false);
    }
  };

  const handleCashCancel = () => {
    setShowCashTypeSelect(false);
    setShowCashCategoryMenu(false);
    setCashSelectedType(null);
  };

  const handleEventsAmountSubmit = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0) {
      setShowEventsCategoryMenu(true);
    }
  };

  const handleEventsCategorySelect = (category: string) => {
    const amount = parseFloat(eventsAmount);
    onAddEntry(day, amount, 'events', category);
    setEventsAmount('');
    setShowEventsCategoryMenu(false);
  };

  const handleEventsCancel = () => {
    setShowEventsCategoryMenu(false);
  };

  return (
    <Card className="h-40 p-2 relative overflow-visible">
      <div className="font-medium text-sm mb-1">{day}</div>
      
      {/* Daily Totals */}
      <div className="absolute top-2 right-2 text-right">
        <div className="text-xs font-semibold text-sales">${convertAmount(data.sales).toFixed(0)}</div>
        <div className="text-xs font-semibold text-delivery">${convertAmount(data.delivery).toFixed(0)}</div>
        <div className="text-xs font-semibold text-accent">${convertAmount(data.events).toFixed(0)}</div>
      </div>

      {/* Input Fields */}
      <div className="mt-4 space-y-1">
        {/* Cash Input */}
        <div className="relative">
          <Input
            placeholder="Cash"
            value={cashAmount}
            onChange={(e) => setCashAmount(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCashAmountSubmit(cashAmount)}
            className="h-7 text-xs"
            disabled={showCashTypeSelect || showCashCategoryMenu}
          />
          
          {/* Cash Type Selection Dropdown */}
          {showCashTypeSelect && (
            <Select onValueChange={(value) => handleCashTypeSelect(value as 'sales' | 'delivery')}>
              <SelectTrigger className="h-7 text-xs absolute top-8 left-0 right-0 z-50 bg-popover">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Cash Category Menu */}
          {showCashCategoryMenu && (
            <div className="absolute top-0 left-full ml-2 bg-popover border border-border rounded-md shadow-lg p-2 z-50 w-32">
              <div className="text-xs font-medium mb-2 text-foreground">Category</div>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-7"
                  onClick={() => handleCashCategorySelect('Training')}
                >
                  Training
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-7"
                  onClick={() => handleCashCategorySelect('Coaching')}
                >
                  Coaching
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-7"
                  onClick={() => handleCashCategorySelect('Speaking')}
                >
                  Speaking
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-7 text-muted-foreground"
                  onClick={handleCashCancel}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Events Input */}
        <div className="relative">
          <Input
            placeholder="Events"
            value={eventsAmount}
            onChange={(e) => setEventsAmount(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleEventsAmountSubmit(eventsAmount)}
            className="h-7 text-xs"
            disabled={showEventsCategoryMenu}
          />

          {/* Events Category Menu */}
          {showEventsCategoryMenu && (
            <div className="absolute top-0 left-full ml-2 bg-popover border border-border rounded-md shadow-lg p-2 z-50 w-32">
              <div className="text-xs font-medium mb-2 text-foreground">Category</div>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-7"
                  onClick={() => handleEventsCategorySelect('Tickets')}
                >
                  Tickets
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-7"
                  onClick={() => handleEventsCategorySelect('Workshops')}
                >
                  Workshops
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-7"
                  onClick={() => handleEventsCategorySelect('Buskouts')}
                >
                  Buskouts
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-7 text-muted-foreground"
                  onClick={handleEventsCancel}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default Calendar;
