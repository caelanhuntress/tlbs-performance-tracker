import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface Entry {
  id: string;
  date: string;
  amount: number;
  type: 'sales' | 'delivery';
  category: 'Training' | 'Coaching' | 'Speaking';
}

interface DayData {
  sales: number;
  delivery: number;
}

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [salesGoal, setSalesGoal] = useState<string>('');
  const [deliveryGoal, setDeliveryGoal] = useState<string>('');
  const { toast } = useToast();

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
      delivery: dayEntries.filter(e => e.type === 'delivery').reduce((sum, e) => sum + e.amount, 0)
    };
  };

  const getWeekData = (weekStart: number): DayData => {
    let sales = 0;
    let delivery = 0;
    
    for (let i = 0; i < 7; i++) {
      const day = weekStart + i;
      if (day > 0 && day <= getDaysInMonth(currentDate)) {
        const dayData = getDayData(day);
        sales += dayData.sales;
        delivery += dayData.delivery;
      }
    }
    
    return { sales, delivery };
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
      delivery: monthEntries.filter(e => e.type === 'delivery').reduce((sum, e) => sum + e.amount, 0)
    };
  };

  const addEntry = (day: number, amount: number, type: 'sales' | 'delivery', category: string) => {
    const newEntry: Entry = {
      id: `${Date.now()}-${Math.random()}`,
      date: getDateString(day),
      amount,
      type,
      category: category as 'Training' | 'Coaching' | 'Speaking'
    };

    setEntries(prev => [...prev, newEntry]);
    toast({
      title: "Entry Added",
      description: `${type === 'sales' ? 'Sales' : 'Delivery'} of $${amount} added for ${category}`,
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
          />
        );
      } else {
        days.push(<div key={i} className="h-32"></div>);
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
            <div className="text-sales font-semibold">${weekData.sales.toLocaleString()}</div>
            <div className="text-delivery font-semibold">${weekData.delivery.toLocaleString()}</div>
          </div>
        </Card>
      );
    }

    return weeks;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Sales Goal"
                value={salesGoal}
                onChange={(e) => setSalesGoal(e.target.value)}
                className="w-32"
              />
              <Input
                placeholder="Delivery Goal"
                value={deliveryGoal}
                onChange={(e) => setDeliveryGoal(e.target.value)}
                className="w-32"
              />
            </div>
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
              <div className="text-2xl font-bold text-sales">${monthTotals.sales.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Sales Total</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-delivery">${monthTotals.delivery.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Delivery Total</div>
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
      </div>
    </div>
  );
};

interface DayCellProps {
  day: number;
  data: DayData;
  onAddEntry: (day: number, amount: number, type: 'sales' | 'delivery', category: string) => void;
}

const DayCell = ({ day, data, onAddEntry }: DayCellProps) => {
  const [salesAmount, setSalesAmount] = useState('');
  const [deliveryAmount, setDeliveryAmount] = useState('');
  const [showSalesCategory, setShowSalesCategory] = useState(false);
  const [showDeliveryCategory, setShowDeliveryCategory] = useState(false);

  const handleSalesSubmit = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0) {
      setShowSalesCategory(true);
    }
  };

  const handleDeliverySubmit = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0) {
      setShowDeliveryCategory(true);
    }
  };

  const submitSalesEntry = (category: string) => {
    const amount = parseFloat(salesAmount);
    onAddEntry(day, amount, 'sales', category);
    setSalesAmount('');
    setShowSalesCategory(false);
  };

  const submitDeliveryEntry = (category: string) => {
    const amount = parseFloat(deliveryAmount);
    onAddEntry(day, amount, 'delivery', category);
    setDeliveryAmount('');
    setShowDeliveryCategory(false);
  };

  return (
    <Card className="h-32 p-2 relative overflow-hidden">
      <div className="font-medium text-sm mb-1">{day}</div>
      
      {/* Daily Totals */}
      <div className="absolute top-2 right-2 text-right">
        <div className="text-xs font-semibold text-sales">${data.sales}</div>
        <div className="text-xs font-semibold text-delivery">${data.delivery}</div>
      </div>

      {/* Input Fields */}
      <div className="space-y-1 mt-4">
        <div className="relative">
          <Input
            placeholder="Amount Sold"
            value={salesAmount}
            onChange={(e) => setSalesAmount(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSalesSubmit(salesAmount)}
            className="h-7 text-xs"
          />
          {showSalesCategory && (
            <Select onValueChange={submitSalesEntry}>
              <SelectTrigger className="h-6 text-xs absolute top-8 left-0 right-0 z-10">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Training">Training</SelectItem>
                <SelectItem value="Coaching">Coaching</SelectItem>
                <SelectItem value="Speaking">Speaking</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="relative">
          <Input
            placeholder="Amount Delivered"
            value={deliveryAmount}
            onChange={(e) => setDeliveryAmount(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleDeliverySubmit(deliveryAmount)}
            className="h-7 text-xs"
          />
          {showDeliveryCategory && (
            <Select onValueChange={submitDeliveryEntry}>
              <SelectTrigger className="h-6 text-xs absolute top-8 left-0 right-0 z-10">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Training">Training</SelectItem>
                <SelectItem value="Coaching">Coaching</SelectItem>
                <SelectItem value="Speaking">Speaking</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </Card>
  );
};

export default Calendar;