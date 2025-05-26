
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { apiService } from '@/services/api';

export interface OrderEntry {
  id?: number;
  auftragsnummer: string;
  prioritaet: 1 | 2;
  zeitstempel: Date;
  zusatzDaten: Record<string, any>;
}

const Monitor = () => {
  const [orders, setOrders] = useState<OrderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.getOrders();
      
      if (result.success && result.orders) {
        // Convert timestamp strings back to Date objects
        const ordersWithDates = result.orders.map(order => ({
          ...order,
          zeitstempel: new Date(order.zeitstempel)
        }));
        setOrders(ordersWithDates);
      } else {
        setError(result.error || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Network error: Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Monitor</h1>
        <Button 
          onClick={fetchOrders} 
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </Button>
      </div>

      {error && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Aktuelle Aufträge ({orders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Lade Aufträge...</p>
            ) : orders.length === 0 ? (
              <p className="text-gray-500">Keine Aufträge vorhanden</p>
            ) : (
              <div className="space-y-2">
                {orders.map((order, index) => (
                  <div 
                    key={order.id || index} 
                    className={`p-3 rounded-lg border ${
                      order.prioritaet === 1 
                        ? 'bg-amber-50 border-amber-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Auftrag: {order.auftragsnummer}</p>
                        <p className="text-sm text-gray-600">
                          Priorität: {order.prioritaet}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.zeitstempel.toLocaleString('de-DE')}
                        </p>
                      </div>
                      {Object.keys(order.zusatzDaten).length > 0 && (
                        <div className="text-sm text-gray-600">
                          {Object.entries(order.zusatzDaten).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium">{key}:</span> {value}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistiken</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {orders.filter(o => o.prioritaet === 1).length}
                </p>
                <p className="text-sm text-gray-600">Prio 1</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-600">
                  {orders.filter(o => o.prioritaet === 2).length}
                </p>
                <p className="text-sm text-gray-600">Prio 2</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Monitor;
