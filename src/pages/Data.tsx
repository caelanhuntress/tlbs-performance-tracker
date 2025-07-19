import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Entry {
  id: string;
  date: string;
  amount: number;
  type: 'sales' | 'delivery';
  category: 'Training' | 'Coaching' | 'Speaking';
}

const Data = () => {
  const [entries, setEntries] = useState<Entry[]>([
    {
      id: '1',
      date: '2024-01-15',
      amount: 2500,
      type: 'sales',
      category: 'Training'
    },
    {
      id: '2',
      date: '2024-01-15',
      amount: 1800,
      type: 'delivery',
      category: 'Coaching'
    },
    {
      id: '3',
      date: '2024-01-14',
      amount: 5000,
      type: 'sales',
      category: 'Speaking'
    }
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<Partial<Entry>>({});
  const { toast } = useToast();

  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const startEdit = (entry: Entry) => {
    setEditingId(entry.id);
    setEditingEntry({ ...entry });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingEntry({});
  };

  const saveEdit = () => {
    if (editingId && editingEntry) {
      setEntries(prev => prev.map(entry => 
        entry.id === editingId 
          ? { ...entry, ...editingEntry } as Entry
          : entry
      ));
      setEditingId(null);
      setEditingEntry({});
      toast({
        title: "Entry Updated",
        description: "The entry has been successfully updated.",
      });
    }
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
    toast({
      title: "Entry Deleted",
      description: "The entry has been successfully deleted.",
      variant: "destructive",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalsByType = () => {
    const sales = entries.filter(e => e.type === 'sales').reduce((sum, e) => sum + e.amount, 0);
    const delivery = entries.filter(e => e.type === 'delivery').reduce((sum, e) => sum + e.amount, 0);
    return { sales, delivery };
  };

  const totals = getTotalsByType();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Data Management</h1>
          <p className="text-muted-foreground">View and edit all your sales and delivery entries</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-sales">${totals.sales.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-delivery">${totals.delivery.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-performance">{entries.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {editingId === entry.id ? (
                          <Input
                            type="date"
                            value={editingEntry.date || entry.date}
                            onChange={(e) => setEditingEntry(prev => ({ ...prev, date: e.target.value }))}
                            className="w-32"
                          />
                        ) : (
                          formatDate(entry.date)
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {editingId === entry.id ? (
                          <Select
                            value={editingEntry.type || entry.type}
                            onValueChange={(value) => setEditingEntry(prev => ({ ...prev, type: value as 'sales' | 'delivery' }))}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sales">Sales</SelectItem>
                              <SelectItem value="delivery">Delivery</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            entry.type === 'sales' 
                              ? 'bg-sales-light text-sales' 
                              : 'bg-delivery-light text-delivery'
                          }`}>
                            {entry.type === 'sales' ? 'Sales' : 'Delivery'}
                          </span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {editingId === entry.id ? (
                          <Select
                            value={editingEntry.category || entry.category}
                            onValueChange={(value) => setEditingEntry(prev => ({ ...prev, category: value as 'Training' | 'Coaching' | 'Speaking' }))}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Training">Training</SelectItem>
                              <SelectItem value="Coaching">Coaching</SelectItem>
                              <SelectItem value="Speaking">Speaking</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          entry.category
                        )}
                      </TableCell>
                      
                      <TableCell className="text-right">
                        {editingId === entry.id ? (
                          <Input
                            type="number"
                            value={editingEntry.amount || entry.amount}
                            onChange={(e) => setEditingEntry(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                            className="w-24 text-right"
                          />
                        ) : (
                          <span className={`font-semibold ${
                            entry.type === 'sales' ? 'text-sales' : 'text-delivery'
                          }`}>
                            ${entry.amount.toLocaleString()}
                          </span>
                        )}
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {editingId === entry.id ? (
                            <>
                              <Button size="sm" onClick={saveEdit}>Save</Button>
                              <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEdit(entry)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteEntry(entry.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {entries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No entries found. Start adding data from the calendar view.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Data;