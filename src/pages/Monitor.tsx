import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface OrderEntry {
  auftragsnummer: string;
  prioritaet: 1 | 2;
  zeitstempel: Date;
}

const Monitor = () => {
  const [prio1Orders, setPrio1Orders] = useState<OrderEntry[]>([]);
  const [prio2Orders, setPrio2Orders] = useState<OrderEntry[]>([]);
  const [, forceUpdate] = useState({});

  useEffect(() => {
    // Load orders from localStorage on component mount
    const loadOrders = () => {
      const savedOrders = localStorage.getItem('orders');
      if (savedOrders) {
        const parsedOrders: OrderEntry[] = JSON.parse(savedOrders, (key, value) => {
          // Convert ISO string back to Date object for zeitstempel
          if (key === 'zeitstempel') return new Date(value);
          return value;
        });
        
        // Split orders by priority
        const prio1 = parsedOrders.filter(order => order.prioritaet === 1);
        const prio2 = parsedOrders.filter(order => order.prioritaet === 2);
        
        // Sort orders by timestamp (oldest first)
        prio1.sort((a, b) => a.zeitstempel.getTime() - b.zeitstempel.getTime());
        prio2.sort((a, b) => a.zeitstempel.getTime() - b.zeitstempel.getTime());
        
        setPrio1Orders(prio1);
        setPrio2Orders(prio2);
      }
    };

    loadOrders();
    
    // Set up an interval to update the timers every second
    const intervalId = setInterval(() => {
      forceUpdate({});
    }, 1000);
    
    // Clean up interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };
  
  const calculateTimeInQS = (zeitstempel: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - zeitstempel.getTime();
    
    // Convert to seconds, minutes, hours, and days
    const seconds = Math.floor((diffMs / 1000) % 60);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Format the string based on whether it's more or less than 24 hours
    if (days > 0) {
      return `${days} Tag${days > 1 ? 'e' : ''}, ${hours} Stunden, ${minutes} Minuten, ${seconds} Sekunden`;
    } else {
      return `${hours} Stunden, ${minutes} Minuten, ${seconds} Sekunden`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <Button 
        variant="outline" 
        size="icon" 
        className="fixed top-6 left-6" 
        asChild
      >
        <Link to="/">
          <Home className="h-4 w-4" />
          <span className="sr-only">Home</span>
        </Link>
      </Button>

      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center mb-8">Auftragsmonitor</h1>
        
        {/* Prio 1 Orders */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-amber-500 text-white">
            <CardTitle>Priorität 1</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {prio1Orders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Keine Aufträge mit Priorität 1 vorhanden</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Auftragsnummer</TableHead>
                    <TableHead>Zeitstempel</TableHead>
                    <TableHead>Aufenthalt in QS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prio1Orders.map((order, index) => (
                    <TableRow key={`${order.auftragsnummer}-${index}`}>
                      <TableCell className="font-medium">{order.auftragsnummer}</TableCell>
                      <TableCell>{formatDate(order.zeitstempel)}</TableCell>
                      <TableCell className="font-medium text-amber-600">
                        {calculateTimeInQS(order.zeitstempel)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Prio 2 Orders */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gray-500 text-white">
            <CardTitle>Priorität 2</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {prio2Orders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Keine Aufträge mit Priorität 2 vorhanden</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Auftragsnummer</TableHead>
                    <TableHead>Zeitstempel</TableHead>
                    <TableHead>Aufenthalt in QS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prio2Orders.map((order, index) => (
                    <TableRow key={`${order.auftragsnummer}-${index}`}>
                      <TableCell className="font-medium">{order.auftragsnummer}</TableCell>
                      <TableCell>{formatDate(order.zeitstempel)}</TableCell>
                      <TableCell className="font-medium text-gray-600">
                        {calculateTimeInQS(order.zeitstempel)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Monitor;
