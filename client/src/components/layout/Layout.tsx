import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'


type InventoryItem = {
  type: string;
  stockQty: number | null;
  lowStockThreshold: number;
};

type InventoryResponse = {
  items: InventoryItem[];
};


// --------------------------------------------------------------------------
// LAYOUT
// Shell that wraps every protected page
// Fetches pending quotes count (for sidebar badge) and low stock count
// (for topbar bell) once and shares them across the whole layout
// --------------------------------------------------------------------------
const Layout = () => {

  // Fetch pending quotes count for the sidebar badge
  const { data: quotesData } = useQuery({
    queryKey: ['quotes', 'pending'],
    queryFn: async () => {
      const res = await api.get('/quotes?status=pending');
      return res.data;
    },
    staleTime: 60 * 1000,   // refresh every minute
  });

  // Fetch low stock inventory items for the topbar bell
  const { data: inventoryData } = useQuery<InventoryResponse>({
    queryKey: ['inventory', 'lowstock'],
    queryFn: async () => {
      const res = await api.get('/inventory');
      return res.data;
    },
    staleTime: 60 * 1000,
  });

  const pendingQuotesCount = quotesData?.count ?? 0;

  // Count items where stockQty is at or below lowStockThreshold
  const lowStockCount = (inventoryData?.items ?? []).filter(
    (item) =>
      item.type === 'product' &&
      item.stockQty !== null &&
      item.stockQty <= item.lowStockThreshold
  ).length;


  return (
    <div className='min-h-screen bg-gray-100'>

      {/* Fixed sidebar */}
      <Sidebar pendingQuotesCount={pendingQuotesCount} />

      {/* Fixed topbar - offset by sidebar width */}
      <Topbar lowStockCount={lowStockCount} />

      {/* Page content - offset by sidebar width and topbar height */}
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-6">
          <Outlet />
        </div>
      </main>

    </div>
  )
}

export default Layout
