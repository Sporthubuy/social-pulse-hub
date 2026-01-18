import { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, RefreshCw, Calendar } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  fetchSalesData,
  calculateSalesSummary,
  SALES_CHANNELS,
  type SaleRecord,
  type SalesSummary,
} from '@/services/google-sheets';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';

type DateFilter = '7d' | '30d' | '90d' | 'all';

export default function SalesDashboard() {
  const [salesData, setSalesData] = useState<SaleRecord[]>([]);
  const [filteredData, setFilteredData] = useState<SaleRecord[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('30d');
  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchSalesData();
      setSalesData(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de ventas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filter data by date
    const now = new Date();
    let filtered = salesData;

    if (dateFilter !== 'all') {
      const days = dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 90;
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - days);

      filtered = salesData.filter(sale => new Date(sale.date) >= cutoff);
    }

    setFilteredData(filtered);
    setSummary(calculateSalesSummary(filtered));
  }, [salesData, dateFilter]);

  const handleRefresh = () => {
    toast({
      title: 'Actualizando...',
      description: 'Obteniendo datos de ventas',
    });
    loadData();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              Facturacion
            </h1>
            <p className="text-muted-foreground mt-1">
              Analisis de ventas por canal
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Date Filter */}
            <div className="flex bg-muted rounded-lg p-1">
              {(['7d', '30d', '90d', 'all'] as DateFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDateFilter(filter)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    dateFilter === filter
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {filter === '7d' ? '7 dias' : filter === '30d' ? '30 dias' : filter === '90d' ? '90 dias' : 'Todo'}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Ventas Totales"
            value={summary ? formatCurrency(summary.totalSales) : '-'}
            icon={<DollarSign className="w-5 h-5" />}
          />
          <MetricCard
            title="Ordenes"
            value={summary?.totalOrders.toString() || '-'}
            icon={<ShoppingCart className="w-5 h-5" />}
          />
          <MetricCard
            title="Ticket Promedio"
            value={summary ? formatCurrency(summary.averageOrderValue) : '-'}
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <MetricCard
            title="Canales Activos"
            value={summary?.salesByChannel.length.toString() || '-'}
            icon={<Calendar className="w-5 h-5" />}
          />
        </div>

        {/* Sales Over Time Chart */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-lg font-display font-semibold text-foreground mb-4">
            Ventas en el Tiempo
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary?.salesByDate || []}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  tickFormatter={(value) => formatNumber(value)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#F9FAFB' }}
                  formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return date.toLocaleDateString('es-AR');
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales by Channel */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">
              Ventas por Canal
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={summary?.salesByChannel || []}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    type="number"
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    tickFormatter={(value) => formatNumber(value)}
                  />
                  <YAxis
                    type="category"
                    dataKey="channel"
                    tick={{ fill: '#9CA3AF', fontSize: 10 }}
                    width={150}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#F9FAFB' }}
                    formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                  />
                  <Bar dataKey="amount" name="Ventas" radius={[0, 4, 4, 0]}>
                    {summary?.salesByChannel.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales by Brand */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">
              Ventas por Marca
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary?.salesByBrand || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="amount"
                    nameKey="brand"
                    label={({ brand, percent }) =>
                      `${brand} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {summary?.salesByBrand.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Channel Details Table */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-lg font-display font-semibold text-foreground mb-4">
            Detalle por Canal
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Canal
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Ventas
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Ordenes
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Ticket Promedio
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    % del Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary?.salesByChannel.map((channel) => (
                  <tr
                    key={channel.channel}
                    className="border-b border-border/50 hover:bg-muted/50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: channel.color }}
                        />
                        <span className="text-sm text-foreground">{channel.channel}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-semibold text-foreground">
                      {formatCurrency(channel.amount)}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                      {channel.orders}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                      {formatCurrency(channel.orders > 0 ? channel.amount / channel.orders : 0)}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                      {summary.totalSales > 0
                        ? ((channel.amount / summary.totalSales) * 100).toFixed(1)
                        : 0}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
              {summary && (
                <tfoot>
                  <tr className="bg-muted/30">
                    <td className="py-3 px-4 text-sm font-semibold text-foreground">Total</td>
                    <td className="py-3 px-4 text-right text-sm font-semibold text-foreground">
                      {formatCurrency(summary.totalSales)}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-semibold text-foreground">
                      {summary.totalOrders}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-semibold text-foreground">
                      {formatCurrency(summary.averageOrderValue)}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-semibold text-foreground">
                      100%
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-lg font-display font-semibold text-foreground mb-4">
            Productos Mas Vendidos
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    #
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Producto
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Cantidad
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Ventas
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary?.topProducts.map((product, index) => (
                  <tr
                    key={product.product}
                    className="border-b border-border/50 hover:bg-muted/50"
                  >
                    <td className="py-3 px-4 text-sm text-muted-foreground">{index + 1}</td>
                    <td className="py-3 px-4 text-sm text-foreground">{product.product}</td>
                    <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                      {product.quantity}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-semibold text-foreground">
                      {formatCurrency(product.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
