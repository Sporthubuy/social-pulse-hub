import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, RefreshCw, BarChart3 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  fetchSalesData,
  SALES_CHANNELS,
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
} from 'recharts';

const BRAND_COLORS: Record<string, string> = {
  'Magic Marine': '#3B82F6',
  'Brabo': '#F59E0B',
  'Princess': '#EC4899',
};

export default function SalesDashboard() {
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchSalesData();
      setSummary(data);
      toast({
        title: 'Datos cargados',
        description: `${data.salesByChannel.length} canales con datos`,
      });
    } catch (error) {
      console.error('Error loading sales:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de ventas. Verifica que el Sheet sea publico.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatShortCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  // Calculate best performing channel
  const topChannel = summary?.salesByChannel[0];

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
              Analisis de ventas por canal y marca
            </p>
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

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Ventas Totales"
            value={summary ? formatCurrency(summary.totalSales) : '-'}
            icon={<DollarSign className="w-5 h-5" />}
          />
          <MetricCard
            title="Canales Activos"
            value={summary?.salesByChannel.filter(c => c.amount > 0).length.toString() || '-'}
            icon={<BarChart3 className="w-5 h-5" />}
          />
          <MetricCard
            title="Mejor Canal"
            value={topChannel?.channel.split(' ').slice(-1)[0] || '-'}
            icon={<TrendingUp className="w-5 h-5 text-green-500" />}
          />
          <MetricCard
            title="Marcas"
            value={summary?.salesByBrand.length.toString() || '-'}
            icon={<BarChart3 className="w-5 h-5" />}
          />
        </div>

        {/* Sales by Month Chart */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-lg font-display font-semibold text-foreground mb-4">
            Ventas por Mes
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary?.salesByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  tickFormatter={(value) => value.substring(0, 3)}
                />
                <YAxis
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  tickFormatter={(value) => formatShortCurrency(value)}
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
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#60A5FA' }}
                />
              </LineChart>
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
                  margin={{ left: 10, right: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    type="number"
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    tickFormatter={(value) => formatShortCurrency(value)}
                  />
                  <YAxis
                    type="category"
                    dataKey="channel"
                    tick={{ fill: '#9CA3AF', fontSize: 9 }}
                    width={130}
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Marca
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Ventas Totales
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
                    <td className="py-3 px-4">
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: `${BRAND_COLORS[channel.brand] || '#6B7280'}20`,
                          color: BRAND_COLORS[channel.brand] || '#6B7280',
                        }}
                      >
                        {channel.brand}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-semibold text-foreground">
                      {formatCurrency(channel.amount)}
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
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4 text-right text-sm font-semibold text-foreground">
                      {formatCurrency(summary.totalSales)}
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

        {/* Monthly Breakdown Table */}
        {summary && summary.channelDetails.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">
              Desglose Mensual por Canal
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground sticky left-0 bg-card">
                      Canal
                    </th>
                    {summary.salesByMonth.map(({ month }) => (
                      <th
                        key={month}
                        className="text-right py-3 px-3 text-sm font-medium text-muted-foreground min-w-[80px]"
                      >
                        {month.substring(0, 3)}
                      </th>
                    ))}
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summary.channelDetails.map((channel) => (
                    <tr
                      key={channel.channel}
                      className="border-b border-border/50 hover:bg-muted/50"
                    >
                      <td className="py-3 px-4 sticky left-0 bg-card">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: channel.color }}
                          />
                          <span className="text-xs text-foreground truncate max-w-[120px]">
                            {channel.channel}
                          </span>
                        </div>
                      </td>
                      {summary.salesByMonth.map(({ month }) => (
                        <td
                          key={month}
                          className="py-3 px-3 text-right text-xs text-muted-foreground"
                        >
                          {channel.monthlyData[month]
                            ? formatShortCurrency(channel.monthlyData[month])
                            : '-'}
                        </td>
                      ))}
                      <td className="py-3 px-4 text-right text-sm font-semibold text-foreground">
                        {formatShortCurrency(channel.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30">
                    <td className="py-3 px-4 text-sm font-semibold text-foreground sticky left-0 bg-muted/30">
                      Total
                    </td>
                    {summary.salesByMonth.map(({ month, amount }) => (
                      <td
                        key={month}
                        className="py-3 px-3 text-right text-xs font-semibold text-foreground"
                      >
                        {formatShortCurrency(amount)}
                      </td>
                    ))}
                    <td className="py-3 px-4 text-right text-sm font-bold text-foreground">
                      {formatShortCurrency(summary.totalSales)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
