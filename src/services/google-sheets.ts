// Google Sheets API Service
// Connects to public Google Sheets to fetch Stock and Sales data

const GOOGLE_SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

// Sales channels configuration
export const SALES_CHANNELS = [
  { id: 'magic-marine-ecommerce', name: 'Magic Marine Ecommerce', brand: 'Magic Marine', color: '#3B82F6' },
  { id: 'magic-marine-tata', name: 'Magic Marine Tata Barcos', brand: 'Magic Marine', color: '#60A5FA' },
  { id: 'magic-marine-aeromarine', name: 'Magic Marine Aeromarine', brand: 'Magic Marine', color: '#93C5FD' },
  { id: 'magic-marine-todosailing', name: 'Magic Marine Todosailing', brand: 'Magic Marine', color: '#BFDBFE' },
  { id: 'brabo-boomerang', name: 'Brabo Boomerang', brand: 'Brabo', color: '#F59E0B' },
  { id: 'brabo-ecommerce', name: 'Brabo Ecommerce', brand: 'Brabo', color: '#FBBF24' },
  { id: 'brabo-extra', name: 'Brabo Extra', brand: 'Brabo', color: '#FCD34D' },
  { id: 'princess-ecommerce', name: 'Princess Ecommerce', brand: 'Princess', color: '#EC4899' },
  { id: 'princess-extra', name: 'Princess Extra', brand: 'Princess', color: '#F472B6' },
] as const;

export type SalesChannel = typeof SALES_CHANNELS[number];

export interface StockItem {
  id: string;
  product: string;
  sku: string;
  quantity: number;
  minStock: number;
  category: string;
  brand: string;
  lastUpdated: string;
}

export interface SaleRecord {
  id: string;
  date: string;
  channel: string;
  amount: number;
  product: string;
  quantity: number;
  category?: string;
}

export interface SalesSummary {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  salesByChannel: { channel: string; amount: number; orders: number; color: string }[];
  salesByDate: { date: string; amount: number }[];
  salesByBrand: { brand: string; amount: number; color: string }[];
  topProducts: { product: string; amount: number; quantity: number }[];
}

export interface StockSummary {
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  stockByBrand: { brand: string; quantity: number }[];
  stockByCategory: { category: string; quantity: number }[];
  lowStockProducts: StockItem[];
}

// Configuration for Google Sheets connection
interface SheetConfig {
  spreadsheetId: string;
  apiKey: string;
  stockSheet: string;
  salesSheet: string;
}

let sheetConfig: SheetConfig | null = null;

export function configureGoogleSheets(config: SheetConfig) {
  sheetConfig = config;
}

// Fetch data from a Google Sheet (public sheet with API key)
async function fetchSheetData(sheetName: string): Promise<any[][]> {
  if (!sheetConfig) {
    throw new Error('Google Sheets not configured. Call configureGoogleSheets first.');
  }

  const { spreadsheetId, apiKey } = sheetConfig;
  const range = `${sheetName}!A:Z`;

  const url = `${GOOGLE_SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch sheet data');
  }

  const data = await response.json();
  return data.values || [];
}

// Alternative: Fetch from published CSV (no API key needed)
export async function fetchPublishedSheetCSV(publishedUrl: string): Promise<string> {
  // Convert the published URL to CSV export format
  const csvUrl = publishedUrl.replace('/pubhtml', '/pub?output=csv');

  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch sheet data');
  }

  return response.text();
}

// Parse CSV data
export function parseCSV(csv: string): any[][] {
  const lines = csv.split('\n');
  return lines.map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  });
}

// Fetch stock data
export async function fetchStockData(): Promise<StockItem[]> {
  if (!sheetConfig) {
    // Return mock data if not configured
    return getMockStockData();
  }

  try {
    const rows = await fetchSheetData(sheetConfig.stockSheet);

    if (rows.length < 2) return [];

    const headers = rows[0].map(h => h.toLowerCase());
    const dataRows = rows.slice(1);

    return dataRows.map((row, index) => ({
      id: String(index + 1),
      product: row[headers.indexOf('product')] || row[headers.indexOf('producto')] || '',
      sku: row[headers.indexOf('sku')] || '',
      quantity: parseInt(row[headers.indexOf('quantity')] || row[headers.indexOf('cantidad')] || '0', 10),
      minStock: parseInt(row[headers.indexOf('minstock')] || row[headers.indexOf('stock minimo')] || '5', 10),
      category: row[headers.indexOf('category')] || row[headers.indexOf('categoria')] || '',
      brand: row[headers.indexOf('brand')] || row[headers.indexOf('marca')] || '',
      lastUpdated: row[headers.indexOf('lastupdated')] || row[headers.indexOf('actualizado')] || new Date().toISOString(),
    })).filter(item => item.product);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return getMockStockData();
  }
}

// Fetch sales data
export async function fetchSalesData(): Promise<SaleRecord[]> {
  if (!sheetConfig) {
    // Return mock data if not configured
    return getMockSalesData();
  }

  try {
    const rows = await fetchSheetData(sheetConfig.salesSheet);

    if (rows.length < 2) return [];

    const headers = rows[0].map(h => h.toLowerCase());
    const dataRows = rows.slice(1);

    return dataRows.map((row, index) => ({
      id: String(index + 1),
      date: row[headers.indexOf('date')] || row[headers.indexOf('fecha')] || '',
      channel: row[headers.indexOf('channel')] || row[headers.indexOf('canal')] || '',
      amount: parseFloat(row[headers.indexOf('amount')] || row[headers.indexOf('monto')] || '0'),
      product: row[headers.indexOf('product')] || row[headers.indexOf('producto')] || '',
      quantity: parseInt(row[headers.indexOf('quantity')] || row[headers.indexOf('cantidad')] || '1', 10),
      category: row[headers.indexOf('category')] || row[headers.indexOf('categoria')] || '',
    })).filter(record => record.date && record.amount);
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return getMockSalesData();
  }
}

// Calculate sales summary
export function calculateSalesSummary(sales: SaleRecord[]): SalesSummary {
  const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalOrders = sales.length;
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Sales by channel
  const channelMap = new Map<string, { amount: number; orders: number }>();
  sales.forEach(sale => {
    const current = channelMap.get(sale.channel) || { amount: 0, orders: 0 };
    channelMap.set(sale.channel, {
      amount: current.amount + sale.amount,
      orders: current.orders + 1,
    });
  });

  const salesByChannel = Array.from(channelMap.entries()).map(([channel, data]) => {
    const channelConfig = SALES_CHANNELS.find(c =>
      c.name.toLowerCase() === channel.toLowerCase() ||
      c.id === channel.toLowerCase().replace(/\s+/g, '-')
    );
    return {
      channel,
      amount: data.amount,
      orders: data.orders,
      color: channelConfig?.color || '#6B7280',
    };
  }).sort((a, b) => b.amount - a.amount);

  // Sales by date
  const dateMap = new Map<string, number>();
  sales.forEach(sale => {
    const date = sale.date.split('T')[0]; // Normalize date
    dateMap.set(date, (dateMap.get(date) || 0) + sale.amount);
  });

  const salesByDate = Array.from(dateMap.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Sales by brand
  const brandMap = new Map<string, number>();
  salesByChannel.forEach(({ channel, amount }) => {
    const channelConfig = SALES_CHANNELS.find(c =>
      c.name.toLowerCase() === channel.toLowerCase()
    );
    const brand = channelConfig?.brand || 'Otros';
    brandMap.set(brand, (brandMap.get(brand) || 0) + amount);
  });

  const brandColors: Record<string, string> = {
    'Magic Marine': '#3B82F6',
    'Brabo': '#F59E0B',
    'Princess': '#EC4899',
    'Otros': '#6B7280',
  };

  const salesByBrand = Array.from(brandMap.entries())
    .map(([brand, amount]) => ({
      brand,
      amount,
      color: brandColors[brand] || '#6B7280',
    }))
    .sort((a, b) => b.amount - a.amount);

  // Top products
  const productMap = new Map<string, { amount: number; quantity: number }>();
  sales.forEach(sale => {
    const current = productMap.get(sale.product) || { amount: 0, quantity: 0 };
    productMap.set(sale.product, {
      amount: current.amount + sale.amount,
      quantity: current.quantity + sale.quantity,
    });
  });

  const topProducts = Array.from(productMap.entries())
    .map(([product, data]) => ({ product, ...data }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  return {
    totalSales,
    totalOrders,
    averageOrderValue,
    salesByChannel,
    salesByDate,
    salesByBrand,
    topProducts,
  };
}

// Calculate stock summary
export function calculateStockSummary(stock: StockItem[]): StockSummary {
  const totalProducts = stock.length;
  const lowStockItems = stock.filter(item => item.quantity > 0 && item.quantity <= item.minStock).length;
  const outOfStockItems = stock.filter(item => item.quantity === 0).length;

  // Stock by brand
  const brandMap = new Map<string, number>();
  stock.forEach(item => {
    brandMap.set(item.brand, (brandMap.get(item.brand) || 0) + item.quantity);
  });

  const stockByBrand = Array.from(brandMap.entries())
    .map(([brand, quantity]) => ({ brand, quantity }))
    .sort((a, b) => b.quantity - a.quantity);

  // Stock by category
  const categoryMap = new Map<string, number>();
  stock.forEach(item => {
    categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + item.quantity);
  });

  const stockByCategory = Array.from(categoryMap.entries())
    .map(([category, quantity]) => ({ category, quantity }))
    .sort((a, b) => b.quantity - a.quantity);

  // Low stock products
  const lowStockProducts = stock
    .filter(item => item.quantity <= item.minStock)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 10);

  return {
    totalProducts,
    lowStockItems,
    outOfStockItems,
    stockByBrand,
    stockByCategory,
    lowStockProducts,
  };
}

// Mock data for development/demo
function getMockStockData(): StockItem[] {
  return [
    { id: '1', product: 'Chaleco Magic Marine Ultimate', sku: 'MM-001', quantity: 15, minStock: 10, category: 'Chalecos', brand: 'Magic Marine', lastUpdated: '2024-01-15' },
    { id: '2', product: 'Guantes Brabo Pro', sku: 'BR-001', quantity: 8, minStock: 10, category: 'Guantes', brand: 'Brabo', lastUpdated: '2024-01-15' },
    { id: '3', product: 'Traje Seco Princess Elite', sku: 'PR-001', quantity: 3, minStock: 5, category: 'Trajes', brand: 'Princess', lastUpdated: '2024-01-15' },
    { id: '4', product: 'Botas Magic Marine Racing', sku: 'MM-002', quantity: 0, minStock: 5, category: 'Calzado', brand: 'Magic Marine', lastUpdated: '2024-01-14' },
    { id: '5', product: 'Casco Brabo Safety', sku: 'BR-002', quantity: 22, minStock: 10, category: 'Cascos', brand: 'Brabo', lastUpdated: '2024-01-15' },
    { id: '6', product: 'Arnés Princess Windsurf', sku: 'PR-002', quantity: 12, minStock: 8, category: 'Arneses', brand: 'Princess', lastUpdated: '2024-01-15' },
    { id: '7', product: 'Gafas Magic Marine UV', sku: 'MM-003', quantity: 45, minStock: 20, category: 'Accesorios', brand: 'Magic Marine', lastUpdated: '2024-01-15' },
    { id: '8', product: 'Bolso Brabo Waterproof', sku: 'BR-003', quantity: 5, minStock: 10, category: 'Bolsos', brand: 'Brabo', lastUpdated: '2024-01-14' },
  ];
}

function getMockSalesData(): SaleRecord[] {
  const channels = SALES_CHANNELS.map(c => c.name);
  const products = [
    'Chaleco Magic Marine Ultimate',
    'Guantes Brabo Pro',
    'Traje Seco Princess Elite',
    'Botas Magic Marine Racing',
    'Casco Brabo Safety',
    'Arnés Princess Windsurf',
  ];

  const sales: SaleRecord[] = [];
  const today = new Date();

  // Generate mock sales for the last 30 days
  for (let i = 0; i < 100; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);

    sales.push({
      id: String(i + 1),
      date: date.toISOString().split('T')[0],
      channel: channels[Math.floor(Math.random() * channels.length)],
      amount: Math.floor(Math.random() * 500) + 50,
      product: products[Math.floor(Math.random() * products.length)],
      quantity: Math.floor(Math.random() * 3) + 1,
    });
  }

  return sales.sort((a, b) => b.date.localeCompare(a.date));
}
