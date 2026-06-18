import { Request, Response, NextFunction } from 'express';
import { Op, fn, col, literal, Sequelize } from 'sequelize';
import { Quote, Invoice, Client, Inventory, QuoteItem } from '../models';

export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const now = new Date();
    const period = (req.query.period as string) || 'month';
    
    // Detect database dialect
    const dialect = Quote.sequelize?.getDialect() || 'postgres';

    // ── KPI counts ────────────────────────────────────────────────────────
    const [allQuotes, totalClients, inventoryItems, paidInvoices] =
      await Promise.all([
        Quote.findAll({ 
          attributes: ['id', 'status', 'grandTotal', 'createdAt'] 
        }),
        Client.count(),
        Inventory.findAll({
          where: { isActive: true },
          attributes: ['id', 'name', 'type', 'stockQty', 'lowStockThreshold'],
        }),
        Invoice.findAll({
          where: { status: 'paid' },
          attributes: ['grandTotal'],
        }),
      ]);

    const totalSales = paidInvoices.reduce(
      (sum, inv) => sum + Number(inv.grandTotal || 0), 
      0
    );

    const quoteCounts = {
      pending:   allQuotes.filter(q => q.status === 'pending').length,
      approved:  allQuotes.filter(q => q.status === 'approved').length,
      rejected:  allQuotes.filter(q => q.status === 'rejected').length,
      cancelled: allQuotes.filter(q => q.status === 'cancelled').length,
      draft:     allQuotes.filter(q => q.status === 'draft').length,
      total:     allQuotes.length,
    };

    // Low stock alerts
    const lowStockAlerts = inventoryItems
      .filter((item: any) => {
        if (item.type !== 'product') return false;
        if (item.stockQty === null || item.stockQty === undefined) return false;
        
        const qty = Number(item.stockQty);
        const threshold = Number(item.lowStockThreshold ?? 0);
        
        return qty <= threshold && qty >= 0;
      })
      .map((item: any) => ({
        id:                item.id,
        name:              item.name,
        stockQty:          Number(item.stockQty),
        lowStockThreshold: Number(item.lowStockThreshold ?? 0),
      }));

    // ── Recent quotes ─────────────────────────────────────────────────────
    const recentQuotes = await Quote.findAll({
      include: [{ model: Client, as: 'client', attributes: ['clientName'] }],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    // ── Revenue by month (Database agnostic) ──────────────────────────────
    let revenueByMonth: any[] = [];
    let quotesByMonth: any[] = [];

    try {
      if (dialect === 'postgres') {
        // PostgreSQL syntax
        revenueByMonth = await Invoice.findAll({
          where: {
            status: 'paid',
            paidAt: { [Op.gte]: new Date(now.getFullYear() - 1, 0, 1) },
          },
          attributes: [
            [fn('DATE_TRUNC', 'month', col('paid_at')), 'month'],
            [fn('SUM', col('grand_total')), 'revenue'],
          ],
          group: [fn('DATE_TRUNC', 'month', col('paid_at'))],
          order: [[literal("DATE_TRUNC('month', paid_at)"), 'ASC']],
          raw: true,
        });

        quotesByMonth = await Quote.findAll({
          attributes: [
            [fn('DATE_TRUNC', 'month', col('created_at')), 'month'],
            [fn('COUNT', col('id')), 'count'],
          ],
          group: [fn('DATE_TRUNC', 'month', col('created_at'))],
          order: [[literal("DATE_TRUNC('month', created_at)"), 'ASC']],
          raw: true,
        });
      } 
      else if (dialect === 'mysql' || dialect === 'mariadb') {
        // MySQL syntax
        revenueByMonth = await Invoice.findAll({
          where: {
            status: 'paid',
            paidAt: { [Op.gte]: new Date(now.getFullYear() - 1, 0, 1) },
          },
          attributes: [
            [fn('DATE_FORMAT', col('paid_at'), '%Y-%m-01'), 'month'],
            [fn('SUM', col('grand_total')), 'revenue'],
          ],
          group: [fn('DATE_FORMAT', col('paid_at'), '%Y-%m-01')],
          order: [[literal("DATE_FORMAT(paid_at, '%Y-%m-01')"), 'ASC']],
          raw: true,
        });

        quotesByMonth = await Quote.findAll({
          attributes: [
            [fn('DATE_FORMAT', col('created_at'), '%Y-%m-01'), 'month'],
            [fn('COUNT', col('id')), 'count'],
          ],
          group: [fn('DATE_FORMAT', col('created_at'), '%Y-%m-01')],
          order: [[literal("DATE_FORMAT(created_at, '%Y-%m-01')"), 'ASC']],
          raw: true,
        });
      }
      else {
        // SQLite syntax
        revenueByMonth = await Invoice.findAll({
          where: {
            status: 'paid',
            paidAt: { [Op.gte]: new Date(now.getFullYear() - 1, 0, 1) },
          },
          attributes: [
            [fn('strftime', '%Y-%m-01', col('paid_at')), 'month'],
            [fn('SUM', col('grand_total')), 'revenue'],
          ],
          group: [fn('strftime', '%Y-%m-01', col('paid_at'))],
          order: [[literal("strftime('%Y-%m-01', paid_at)"), 'ASC']],
          raw: true,
        });

        quotesByMonth = await Quote.findAll({
          attributes: [
            [fn('strftime', '%Y-%m-01', col('created_at')), 'month'],
            [fn('COUNT', col('id')), 'count'],
          ],
          group: [fn('strftime', '%Y-%m-01', col('created_at'))],
          order: [[literal("strftime('%Y-%m-01', created_at)"), 'ASC']],
          raw: true,
        });
      }
    } catch (err) {
      console.error('Error fetching monthly data:', err);
      // Fallback to empty arrays if queries fail
      revenueByMonth = [];
      quotesByMonth = [];
    }

    // ── Top Items ─────────────────────────────────────────────────────────
    let topItems: any[] = [];
    try {
      topItems = await QuoteItem.findAll({
        attributes: [
          'itemName',
          [fn('COUNT', col('id')), 'timesQuoted'],
          [fn('SUM', col('lineTotal')), 'totalValue'],
        ],
        group: ['itemName'],
        order: [[fn('SUM', col('lineTotal')), 'DESC']],
        limit: 5,
        raw: true,
      });
    } catch (err) {
      console.error('Error fetching top items:', err);
      topItems = [];
    }

    const quotesByStatus = [
      { status: 'Draft',     count: quoteCounts.draft,     fill: '#6B7280' },
      { status: 'Pending',   count: quoteCounts.pending,   fill: '#F59E0B' },
      { status: 'Approved',  count: quoteCounts.approved,  fill: '#10B981' },
      { status: 'Rejected',  count: quoteCounts.rejected,  fill: '#EF4444' },
      { status: 'Cancelled', count: quoteCounts.cancelled, fill: '#9CA3AF' },
    ];

    // Format month names
    const formattedRevenueByMonth = revenueByMonth.map((r: any) => {
      let monthDate;
      if (r.month) {
        monthDate = new Date(r.month);
        if (isNaN(monthDate.getTime())) {
          // If date parsing fails, try to extract from string
          const match = r.month.match(/\d{4}-\d{2}/);
          if (match) {
            monthDate = new Date(match[0] + '-01');
          } else {
            monthDate = new Date();
          }
        }
      } else {
        monthDate = new Date();
      }
      return {
        month: monthDate.toLocaleDateString('en-NG', { month: 'short', year: '2-digit' }),
        revenue: Number(r.revenue || 0),
      };
    });

    const formattedQuotesByMonth = quotesByMonth.map((q: any) => {
      let monthDate;
      if (q.month) {
        monthDate = new Date(q.month);
        if (isNaN(monthDate.getTime())) {
          const match = q.month.match(/\d{4}-\d{2}/);
          if (match) {
            monthDate = new Date(match[0] + '-01');
          } else {
            monthDate = new Date();
          }
        }
      } else {
        monthDate = new Date();
      }
      return {
        month: monthDate.toLocaleDateString('en-NG', { month: 'short', year: '2-digit' }),
        count: Number(q.count || 0),
      };
    });

    res.status(200).json({
      kpi: {
        totalSales,
        totalClients,
        lowStockCount: lowStockAlerts.length,
        quotes: quoteCounts,
      },
      lowStockAlerts,
      recentQuotes,
      charts: {
        revenueByMonth: formattedRevenueByMonth,
        quotesByStatus,
        quotesByMonth: formattedQuotesByMonth,
        topItems: topItems.map((i: any) => ({
          name: i.itemName,
          timesQuoted: Number(i.timesQuoted || 0),
          totalValue: Number(i.totalValue || 0),
        })),
      },
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    next(error);
  }
};