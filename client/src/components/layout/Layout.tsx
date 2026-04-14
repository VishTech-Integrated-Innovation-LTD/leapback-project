import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import { useState }  from 'react';


type InventoryItem = {
  // type: string;
  // stockQty: number | null;
  // lowStockThreshold: number;

  id:                string;
  name:              string;
  type:              string;
  stockQty:          number;
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

  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  const lowStockItems = (inventoryData?.items ?? []).filter(
    (item) =>
      item.type === 'product' &&
      item.stockQty !== null &&
      item.stockQty <= item.lowStockThreshold
  );


  return (
    <div className='min-h-screen bg-[#0A0F1E]'>

      {/* Fixed sidebar */}
      <Sidebar 
      pendingQuotesCount={pendingQuotesCount}
      isOpen={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
       />

      {/* Fixed topbar - offset by sidebar width */}
      <Topbar 
      lowStockCount={lowStockItems.length}
      lowStockItems={lowStockItems}
      onMenuToggle={() => setSidebarOpen((v) => !v)}
       />

      {/* Page content - offset by sidebar width and topbar height */}
      {/* <main className="ml-64 pt-16 min-h-screen"> */}
        {/* <div className="p-6"> */}
      {/* On mobile: no left margin. On desktop: offset by sidebar width */}
        <main className="pt-16 min-h-screen lg:ml-64">
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>

    </div>
  )
}

export default Layout
