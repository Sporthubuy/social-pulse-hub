import { useState, useEffect } from 'react';
import { Package, AlertTriangle, DollarSign, RefreshCw, MapPin, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  fetchStockData,
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
} from 'recharts';

const BRAND_COLORS: Record<string, string> = {
  'Magic Marine': '#3B82F6',
  'Brabo': '#F59E0B',
  'Princess': '#EC4899',
};

const LOCATION_COLORS = ['#3B82F6', '#F59E0B', '#EC4899', '#10B981', '#8B5CF6', '#6B7280', '#EF4444'];

export default function StockDashboard() {
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchStockData();
      setSummary(data);
      toast({
        title: 'Datos cargados',
        description: `${data.totalProducts} productos encontrados`,
      });
    } catch (error) {
      console.error('Error loading stock:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de stock. Verifica que el Sheet sea publico.',
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-AR').format(num);
  };

  // Filter products
  const filteredProducts = summary?.allProducts.filter(product => {
    const matchesSearch = searchTerm === '' ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.itemCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = selectedBrand === 'all' || product.brand === selectedBrand;
    return matchesSearch && matchesBrand;
  }) || [];

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
              Control de inventario - Magic Marine, Brabo y Princess
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
            title="Valor en Stock"
            value={summary ? formatCurrency(summary.totalStockValue) : '-'}
            icon={<DollarSign className="w-5 h-5" />}
          />
          <MetricCard
            title="Stock Bajo"
            value={summary?.lowStockProducts.length.toString() || '-'}
            icon={<AlertTriangle className="w-5 h-5 text-yellow-500" />}
          />
          <MetricCard
            title="Ubicaciones"
            value={summary?.stockByLocation.length.toString() || '-'}
            icon={<MapPin className="w-5 h-5" />}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock by Brand */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">
              Stock por Marca (Valor)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary?.stockByBrand || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="brand" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <YAxis
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#F9FAFB' }}
                    formatter={(value: number) => [formatCurrency(value), 'Valor']}
                  />
                  <Bar dataKey="value" name="Valor">
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

          {/* Stock by Location */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">
              Stock por Ubicacion
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary?.stockByLocation || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="quantity"
                    nameKey="location"
                    label={({ location, percent }) =>
                      percent > 0.05 ? `${location} ${(percent * 100).toFixed(0)}%` : ''
                    }
                    labelLine={false}
                  >
                    {summary?.stockByLocation.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={LOCATION_COLORS[index % LOCATION_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatNumber(value), 'Unidades']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Low Stock Alert Table */}
        {summary && summary.lowStockProducts.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Productos con Stock Bajo (≤3 unidades)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Codigo</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Producto</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Talle</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Marca</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.lowStockProducts.map((item) => (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm text-muted-foreground font-mono">{item.itemCode}</td>
                      <td className="py-3 px-4 text-sm text-foreground">{item.description}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{item.size}</td>
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
                        <span className="text-sm font-semibold text-yellow-500">
                          {item.totalStock}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Full Inventory Table */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h3 className="text-lg font-display font-semibold text-foreground">
              Inventario Completo
            </h3>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              {/* Brand filter */}
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground"
              >
                <option value="all">Todas las marcas</option>
                <option value="Magic Marine">Magic Marine</option>
                <option value="Brabo">Brabo</option>
                <option value="Princess">Princess</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-muted-foreground mb-3">
            Mostrando {filteredProducts.length} de {summary?.totalProducts || 0} productos
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Codigo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Producto</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Talle</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Marca</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Stock</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Costo</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Precio</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Ventas</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.slice(0, 100).map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm text-muted-foreground font-mono">{item.itemCode}</td>
                    <td className="py-3 px-4 text-sm text-foreground max-w-xs truncate" title={item.description}>
                      {item.description}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{item.size}</td>
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
                          item.totalStock === 0
                            ? 'text-red-500'
                            : item.totalStock <= 3
                            ? 'text-yellow-500'
                            : 'text-foreground'
                        }`}
                      >
                        {item.totalStock}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                      {formatCurrency(item.costoUnitario)}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-foreground font-medium">
                      {formatCurrency(item.precio)}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-green-500 font-medium">
                      {formatCurrency(item.ventaTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length > 100 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Mostrando primeros 100 productos. Usa el buscador para filtrar.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
