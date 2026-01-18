import { useState, useEffect } from 'react';
import { Package, AlertTriangle, XCircle, RefreshCw, TrendingDown } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  fetchStockData,
  calculateStockSummary,
  type StockItem,
  type StockSummary,
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
} from 'recharts';

const BRAND_COLORS: Record<string, string> = {
  'Magic Marine': '#3B82F6',
  'Brabo': '#F59E0B',
  'Princess': '#EC4899',
};

const CATEGORY_COLORS = ['#3B82F6', '#F59E0B', '#EC4899', '#10B981', '#8B5CF6', '#6B7280'];

export default function StockDashboard() {
  const [stockData, setStockData] = useState<StockItem[]>([]);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchStockData();
      setStockData(data);
      setSummary(calculateStockSummary(data));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de stock',
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
      description: 'Obteniendo datos de stock',
    });
    loadData();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              Stock
            </h1>
            <p className="text-muted-foreground mt-1">
              Control de inventario en tiempo real
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
            title="Total Productos"
            value={summary?.totalProducts.toString() || '-'}
            icon={<Package className="w-5 h-5" />}
          />
          <MetricCard
            title="Stock Bajo"
            value={summary?.lowStockItems.toString() || '-'}
            icon={<AlertTriangle className="w-5 h-5 text-yellow-500" />}
          />
          <MetricCard
            title="Sin Stock"
            value={summary?.outOfStockItems.toString() || '-'}
            icon={<XCircle className="w-5 h-5 text-red-500" />}
          />
          <MetricCard
            title="Marcas"
            value={summary?.stockByBrand.length.toString() || '-'}
            icon={<TrendingDown className="w-5 h-5" />}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock by Brand */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">
              Stock por Marca
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary?.stockByBrand || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="brand" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#F9FAFB' }}
                  />
                  <Bar dataKey="quantity" name="Cantidad">
                    {summary?.stockByBrand.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={BRAND_COLORS[entry.brand] || '#6B7280'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stock by Category */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">
              Stock por Categoria
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary?.stockByCategory || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="quantity"
                    nameKey="category"
                    label={({ category, percent }) =>
                      `${category} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {summary?.stockByCategory.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Low Stock Alert Table */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-lg font-display font-semibold text-foreground mb-4">
            Productos con Stock Bajo
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Producto
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    SKU
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Marca
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                    Stock Actual
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                    Stock Minimo
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary?.lowStockProducts.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm text-foreground">{item.product}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{item.sku}</td>
                    <td className="py-3 px-4">
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: `${BRAND_COLORS[item.brand] || '#6B7280'}20`,
                          color: BRAND_COLORS[item.brand] || '#6B7280',
                        }}
                      >
                        {item.brand}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm font-semibold text-foreground">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-muted-foreground">
                      {item.minStock}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.quantity === 0 ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-500">
                          Sin Stock
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-500">
                          Stock Bajo
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {(!summary?.lowStockProducts || summary.lowStockProducts.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No hay productos con stock bajo
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Full Inventory Table */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-lg font-display font-semibold text-foreground mb-4">
            Inventario Completo
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Producto
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    SKU
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Categoria
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Marca
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                    Cantidad
                  </th>
                </tr>
              </thead>
              <tbody>
                {stockData.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm text-foreground">{item.product}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{item.sku}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{item.category}</td>
                    <td className="py-3 px-4">
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: `${BRAND_COLORS[item.brand] || '#6B7280'}20`,
                          color: BRAND_COLORS[item.brand] || '#6B7280',
                        }}
                      >
                        {item.brand}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-semibold ${
                          item.quantity === 0
                            ? 'text-red-500'
                            : item.quantity <= item.minStock
                            ? 'text-yellow-500'
                            : 'text-foreground'
                        }`}
                      >
                        {item.quantity}
                      </span>
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
