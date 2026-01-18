// Google Sheets API Service
// Connects to Google Sheets to fetch Stock and Sales data

const GOOGLE_SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

// Spreadsheet configuration
const SPREADSHEET_ID = '1fvHx8JOH3jTsoiZSBDxssGvqoWMUz_pXmGACr0FcV00';
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || 'AIzaSyAwqt68_Xx2FwuLYuaziEoBXtnTsUycpo8';

// Sheet names
const SHEETS = {
  SALES: 'Planilla Maestra SH',
  STOCK_MM: 'Data MM',
  STOCK_HOCKEY: 'Data Hockey',
};

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

// Months mapping
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export interface StockItem {
  id: string;
  itemCode: string;
  description: string;
  size: string;
  qtyImportada: number;
  stockByLocation: Record<string, number>;
  totalStock: number;
  costoUnitario: number;
  costoUnitarioUSD: number;
  costoEnStock: number;
  precioMayorista?: number;
  precio: number;
  precioUSA?: number;
  ventaTotal: number;
  brand: 'Magic Marine' | 'Brabo' | 'Princess';
}

export interface SalesByChannel {
  channel: string;
  monthlyData: Record<string, number>;
  total: number;
  color: string;
  brand: string;
}

export interface SalesSummary {
  totalSales: number;
  salesByChannel: { channel: string; amount: number; color: string; brand: string }[];
  salesByMonth: { month: string; amount: number }[];
  salesByBrand: { brand: string; amount: number; color: string }[];
  channelDetails: SalesByChannel[];
}

export interface StockSummary {
  totalProducts: number;
  totalStockValue: number;
  totalStockValueUSD: number;
  stockByBrand: { brand: string; quantity: number; value: number }[];
  stockByLocation: { location: string; quantity: number }[];
  lowStockProducts: StockItem[];
  allProducts: StockItem[];
}

// Fetch data from Google Sheets API
async function fetchSheetData(sheetName: string, range: string = 'A:Z'): Promise<any[][]> {
  const fullRange = `${sheetName}!${range}`;
  const url = `${GOOGLE_SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(fullRange)}?key=${API_KEY}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      console.error('Google Sheets API error:', error);
      throw new Error(error.error?.message || 'Failed to fetch sheet data');
    }

    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}

// Parse currency values (handles $, USD, commas, dots)
function parseCurrency(value: string | number | undefined): number {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;

  // Remove currency symbols and spaces
  let cleaned = value.toString()
    .replace(/USD/gi, '')
    .replace(/\$/g, '')
    .replace(/\s/g, '')
    .trim();

  // Handle different number formats
  // If has both . and ,, determine which is decimal separator
  if (cleaned.includes('.') && cleaned.includes(',')) {
    // If comma comes after dot, comma is decimal (European: 1.234,56)
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Dot is decimal (US: 1,234.56)
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    // Check if comma is decimal separator (e.g., 1234,56) or thousands (e.g., 1,234)
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Comma is decimal separator
      cleaned = cleaned.replace(',', '.');
    } else {
      // Comma is thousands separator
      cleaned = cleaned.replace(/,/g, '');
    }
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Fetch and parse sales data from "Planilla Maestra SH"
export async function fetchSalesData(): Promise<SalesSummary> {
  try {
    const rows = await fetchSheetData(SHEETS.SALES, 'A1:N20');

    if (rows.length < 5) {
      console.warn('Not enough rows in sales sheet');
      return getEmptySalesSummary();
    }

    // Find the header row with months (row 4, index 3)
    const headerRow = rows[3];
    const monthColumns: { month: string; colIndex: number }[] = [];

    // Map column indices to months (starting from column C, index 2)
    for (let i = 2; i < headerRow.length; i++) {
      const monthName = headerRow[i]?.toString().trim();
      if (monthName && MONTHS.includes(monthName)) {
        monthColumns.push({ month: monthName, colIndex: i });
      }
    }

    // Parse channel data (rows 5-13, indices 4-12)
    const channelDetails: SalesByChannel[] = [];
    let totalSales = 0;

    for (let rowIndex = 4; rowIndex <= 12 && rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      if (!row || !row[1]) continue;

      const channelName = row[1]?.toString().trim();
      const channelConfig = SALES_CHANNELS.find(c =>
        c.name.toLowerCase() === channelName.toLowerCase()
      );

      if (!channelConfig) continue;

      const monthlyData: Record<string, number> = {};
      let channelTotal = 0;

      for (const { month, colIndex } of monthColumns) {
        const value = parseCurrency(row[colIndex]);
        monthlyData[month] = value;
        channelTotal += value;
      }

      totalSales += channelTotal;

      channelDetails.push({
        channel: channelName,
        monthlyData,
        total: channelTotal,
        color: channelConfig.color,
        brand: channelConfig.brand,
      });
    }

    // Calculate summaries
    const salesByChannel = channelDetails.map(c => ({
      channel: c.channel,
      amount: c.total,
      color: c.color,
      brand: c.brand,
    })).sort((a, b) => b.amount - a.amount);

    // Sales by month
    const salesByMonth: { month: string; amount: number }[] = [];
    for (const { month } of monthColumns) {
      const monthTotal = channelDetails.reduce((sum, c) => sum + (c.monthlyData[month] || 0), 0);
      salesByMonth.push({ month, amount: monthTotal });
    }

    // Sales by brand
    const brandTotals = new Map<string, number>();
    const brandColors: Record<string, string> = {
      'Magic Marine': '#3B82F6',
      'Brabo': '#F59E0B',
      'Princess': '#EC4899',
    };

    channelDetails.forEach(c => {
      brandTotals.set(c.brand, (brandTotals.get(c.brand) || 0) + c.total);
    });

    const salesByBrand = Array.from(brandTotals.entries())
      .map(([brand, amount]) => ({
        brand,
        amount,
        color: brandColors[brand] || '#6B7280',
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalSales,
      salesByChannel,
      salesByMonth,
      salesByBrand,
      channelDetails,
    };
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return getEmptySalesSummary();
  }
}

// Fetch and parse stock data from "Data MM" and "Data Hockey"
export async function fetchStockData(): Promise<StockSummary> {
  try {
    const [mmRows, hockeyRows] = await Promise.all([
      fetchSheetData(SHEETS.STOCK_MM, 'A1:N500'),
      fetchSheetData(SHEETS.STOCK_HOCKEY, 'A1:N500'),
    ]);

    const allProducts: StockItem[] = [];

    // Parse Magic Marine stock (Data MM)
    // Headers: Item Code, Item Description, Size, Qty Importada, TodoSailing, Deposito, Tata Barcos, Aeromarine, Costo unitario, Cto en stock, Precio en USA, Total Ventas
    if (mmRows.length > 2) {
      const mmHeaderRow = mmRows[1]; // Row 2 has headers

      for (let i = 2; i < mmRows.length; i++) {
        const row = mmRows[i];
        if (!row || !row[0] || !row[1]) continue;

        const itemCode = row[0]?.toString().trim();
        const description = row[1]?.toString().trim();

        if (!itemCode || itemCode.toLowerCase() === 'item code') continue;

        const stockLocations: Record<string, number> = {
          'TodoSailing': parseInt(row[4]) || 0,
          'Deposito': parseInt(row[5]) || 0,
          'Tata Barcos': parseInt(row[6]) || 0,
          'Aeromarine': parseInt(row[7]) || 0,
        };

        const totalStock = Object.values(stockLocations).reduce((a, b) => a + b, 0);

        allProducts.push({
          id: `mm-${i}`,
          itemCode,
          description,
          size: row[2]?.toString() || '',
          qtyImportada: parseInt(row[3]) || 0,
          stockByLocation: stockLocations,
          totalStock,
          costoUnitario: parseCurrency(row[8]),
          costoUnitarioUSD: 0,
          costoEnStock: parseCurrency(row[9]),
          precio: parseCurrency(row[10]),
          precioUSA: parseCurrency(row[10]),
          ventaTotal: parseCurrency(row[11]),
          brand: 'Magic Marine',
        });
      }
    }

    // Parse Hockey stock (Data Hockey) - Brabo and Princess
    // Headers: Item Code, Item Description, Size, Qty Importada, Boomerang, Casa, Sofia/Lucia, Costo unitario, Cto unit USD, Cto en stock, Precio Mayorista, Precio, Venta Total
    if (hockeyRows.length > 2) {
      for (let i = 2; i < hockeyRows.length; i++) {
        const row = hockeyRows[i];
        if (!row || !row[0] || !row[1]) continue;

        const itemCode = row[0]?.toString().trim();
        const description = row[1]?.toString().trim();

        if (!itemCode || itemCode.toLowerCase() === 'item code') continue;

        // Determine brand based on item code or description
        let brand: 'Brabo' | 'Princess' = 'Brabo';
        if (description.toLowerCase().includes('princess') || itemCode.toLowerCase().includes('princess')) {
          brand = 'Princess';
        }

        const stockLocations: Record<string, number> = {
          'Boomerang': parseInt(row[4]) || 0,
          'Casa': parseInt(row[5]) || 0,
          'Sofia/Lucia': parseInt(row[6]) || 0,
        };

        const totalStock = Object.values(stockLocations).reduce((a, b) => a + b, 0);

        allProducts.push({
          id: `hockey-${i}`,
          itemCode,
          description,
          size: row[2]?.toString() || '',
          qtyImportada: parseInt(row[3]) || 0,
          stockByLocation: stockLocations,
          totalStock,
          costoUnitario: parseCurrency(row[7]),
          costoUnitarioUSD: parseCurrency(row[8]),
          costoEnStock: parseCurrency(row[9]),
          precioMayorista: parseCurrency(row[10]),
          precio: parseCurrency(row[11]),
          ventaTotal: parseCurrency(row[12]),
          brand,
        });
      }
    }

    // Calculate summaries
    const totalProducts = allProducts.length;
    const totalStockValue = allProducts.reduce((sum, p) => sum + p.costoEnStock, 0);
    const totalStockValueUSD = allProducts.reduce((sum, p) => sum + (p.costoUnitarioUSD * p.totalStock), 0);

    // Stock by brand
    const brandMap = new Map<string, { quantity: number; value: number }>();
    allProducts.forEach(p => {
      const current = brandMap.get(p.brand) || { quantity: 0, value: 0 };
      brandMap.set(p.brand, {
        quantity: current.quantity + p.totalStock,
        value: current.value + p.costoEnStock,
      });
    });

    const stockByBrand = Array.from(brandMap.entries())
      .map(([brand, data]) => ({ brand, ...data }))
      .sort((a, b) => b.value - a.value);

    // Stock by location (aggregate all locations)
    const locationMap = new Map<string, number>();
    allProducts.forEach(p => {
      Object.entries(p.stockByLocation).forEach(([loc, qty]) => {
        locationMap.set(loc, (locationMap.get(loc) || 0) + qty);
      });
    });

    const stockByLocation = Array.from(locationMap.entries())
      .map(([location, quantity]) => ({ location, quantity }))
      .sort((a, b) => b.quantity - a.quantity);

    // Low stock products (less than 3 units)
    const lowStockProducts = allProducts
      .filter(p => p.totalStock > 0 && p.totalStock <= 3)
      .sort((a, b) => a.totalStock - b.totalStock)
      .slice(0, 20);

    return {
      totalProducts,
      totalStockValue,
      totalStockValueUSD,
      stockByBrand,
      stockByLocation,
      lowStockProducts,
      allProducts,
    };
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return getEmptyStockSummary();
  }
}

// Empty summaries for error cases
function getEmptySalesSummary(): SalesSummary {
  return {
    totalSales: 0,
    salesByChannel: [],
    salesByMonth: [],
    salesByBrand: [],
    channelDetails: [],
  };
}

function getEmptyStockSummary(): StockSummary {
  return {
    totalProducts: 0,
    totalStockValue: 0,
    totalStockValueUSD: 0,
    stockByBrand: [],
    stockByLocation: [],
    lowStockProducts: [],
    allProducts: [],
  };
}

// Legacy exports for backwards compatibility
export type SaleRecord = {
  id: string;
  date: string;
  channel: string;
  amount: number;
  product: string;
  quantity: number;
};

export function calculateSalesSummary(sales: SaleRecord[]) {
  // This is now handled by fetchSalesData directly
  return getEmptySalesSummary();
}

export function calculateStockSummary(stock: StockItem[]) {
  // This is now handled by fetchStockData directly
  return getEmptyStockSummary();
}
