"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
const getDashboardStats = async (req, res, next) => {
    try {
        const now = new Date();
        const period = req.query.period || 'month';
        // Detect database dialect
        const dialect = models_1.Quote.sequelize?.getDialect() || 'postgres';
        // ── KPI counts ────────────────────────────────────────────────────────
        const [allQuotes, totalClients, inventoryItems, paidInvoices] = await Promise.all([
            models_1.Quote.findAll({
                attributes: ['id', 'status', 'grandTotal', 'createdAt']
            }),
            models_1.Client.count(),
            models_1.Inventory.findAll({
                where: { isActive: true },
                attributes: ['id', 'name', 'type', 'stockQty', 'lowStockThreshold'],
            }),
            models_1.Invoice.findAll({
                where: { status: 'paid' },
                attributes: ['grandTotal'],
            }),
        ]);
        const totalSales = paidInvoices.reduce((sum, inv) => sum + Number(inv.grandTotal || 0), 0);
        const quoteCounts = {
            pending: allQuotes.filter(q => q.status === 'pending').length,
            approved: allQuotes.filter(q => q.status === 'approved').length,
            rejected: allQuotes.filter(q => q.status === 'rejected').length,
            cancelled: allQuotes.filter(q => q.status === 'cancelled').length,
            draft: allQuotes.filter(q => q.status === 'draft').length,
            total: allQuotes.length,
        };
        // Low stock alerts
        const lowStockAlerts = inventoryItems
            .filter((item) => {
            if (item.type !== 'product')
                return false;
            if (item.stockQty === null || item.stockQty === undefined)
                return false;
            const qty = Number(item.stockQty);
            const threshold = Number(item.lowStockThreshold ?? 0);
            return qty <= threshold && qty >= 0;
        })
            .map((item) => ({
            id: item.id,
            name: item.name,
            stockQty: Number(item.stockQty),
            lowStockThreshold: Number(item.lowStockThreshold ?? 0),
        }));
        // ── Recent quotes ─────────────────────────────────────────────────────
        const recentQuotes = await models_1.Quote.findAll({
            include: [{ model: models_1.Client, as: 'client', attributes: ['clientName'] }],
            order: [['createdAt', 'DESC']],
            limit: 5,
        });
        // ── Revenue by month (Database agnostic) ──────────────────────────────
        let revenueByMonth = [];
        let quotesByMonth = [];
        try {
            if (dialect === 'postgres') {
                // PostgreSQL syntax
                revenueByMonth = await models_1.Invoice.findAll({
                    where: {
                        status: 'paid',
                        paidAt: { [sequelize_1.Op.gte]: new Date(now.getFullYear() - 1, 0, 1) },
                    },
                    attributes: [
                        [(0, sequelize_1.fn)('DATE_TRUNC', 'month', (0, sequelize_1.col)('paid_at')), 'month'],
                        [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('grand_total')), 'revenue'],
                    ],
                    group: [(0, sequelize_1.fn)('DATE_TRUNC', 'month', (0, sequelize_1.col)('paid_at'))],
                    order: [[(0, sequelize_1.literal)("DATE_TRUNC('month', paid_at)"), 'ASC']],
                    raw: true,
                });
                quotesByMonth = await models_1.Quote.findAll({
                    attributes: [
                        [(0, sequelize_1.fn)('DATE_TRUNC', 'month', (0, sequelize_1.col)('created_at')), 'month'],
                        [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'count'],
                    ],
                    group: [(0, sequelize_1.fn)('DATE_TRUNC', 'month', (0, sequelize_1.col)('created_at'))],
                    order: [[(0, sequelize_1.literal)("DATE_TRUNC('month', created_at)"), 'ASC']],
                    raw: true,
                });
            }
            else if (dialect === 'mysql' || dialect === 'mariadb') {
                // MySQL syntax
                revenueByMonth = await models_1.Invoice.findAll({
                    where: {
                        status: 'paid',
                        paidAt: { [sequelize_1.Op.gte]: new Date(now.getFullYear() - 1, 0, 1) },
                    },
                    attributes: [
                        [(0, sequelize_1.fn)('DATE_FORMAT', (0, sequelize_1.col)('paid_at'), '%Y-%m-01'), 'month'],
                        [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('grand_total')), 'revenue'],
                    ],
                    group: [(0, sequelize_1.fn)('DATE_FORMAT', (0, sequelize_1.col)('paid_at'), '%Y-%m-01')],
                    order: [[(0, sequelize_1.literal)("DATE_FORMAT(paid_at, '%Y-%m-01')"), 'ASC']],
                    raw: true,
                });
                quotesByMonth = await models_1.Quote.findAll({
                    attributes: [
                        [(0, sequelize_1.fn)('DATE_FORMAT', (0, sequelize_1.col)('created_at'), '%Y-%m-01'), 'month'],
                        [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'count'],
                    ],
                    group: [(0, sequelize_1.fn)('DATE_FORMAT', (0, sequelize_1.col)('created_at'), '%Y-%m-01')],
                    order: [[(0, sequelize_1.literal)("DATE_FORMAT(created_at, '%Y-%m-01')"), 'ASC']],
                    raw: true,
                });
            }
            else {
                // SQLite syntax
                revenueByMonth = await models_1.Invoice.findAll({
                    where: {
                        status: 'paid',
                        paidAt: { [sequelize_1.Op.gte]: new Date(now.getFullYear() - 1, 0, 1) },
                    },
                    attributes: [
                        [(0, sequelize_1.fn)('strftime', '%Y-%m-01', (0, sequelize_1.col)('paid_at')), 'month'],
                        [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('grand_total')), 'revenue'],
                    ],
                    group: [(0, sequelize_1.fn)('strftime', '%Y-%m-01', (0, sequelize_1.col)('paid_at'))],
                    order: [[(0, sequelize_1.literal)("strftime('%Y-%m-01', paid_at)"), 'ASC']],
                    raw: true,
                });
                quotesByMonth = await models_1.Quote.findAll({
                    attributes: [
                        [(0, sequelize_1.fn)('strftime', '%Y-%m-01', (0, sequelize_1.col)('created_at')), 'month'],
                        [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'count'],
                    ],
                    group: [(0, sequelize_1.fn)('strftime', '%Y-%m-01', (0, sequelize_1.col)('created_at'))],
                    order: [[(0, sequelize_1.literal)("strftime('%Y-%m-01', created_at)"), 'ASC']],
                    raw: true,
                });
            }
        }
        catch (err) {
            console.error('Error fetching monthly data:', err);
            // Fallback to empty arrays if queries fail
            revenueByMonth = [];
            quotesByMonth = [];
        }
        // ── Top Items ─────────────────────────────────────────────────────────
        let topItems = [];
        try {
            topItems = await models_1.QuoteItem.findAll({
                attributes: [
                    'itemName',
                    [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'timesQuoted'],
                    [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('lineTotal')), 'totalValue'],
                ],
                group: ['itemName'],
                order: [[(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('lineTotal')), 'DESC']],
                limit: 5,
                raw: true,
            });
        }
        catch (err) {
            console.error('Error fetching top items:', err);
            topItems = [];
        }
        const quotesByStatus = [
            { status: 'Draft', count: quoteCounts.draft, fill: '#6B7280' },
            { status: 'Pending', count: quoteCounts.pending, fill: '#F59E0B' },
            { status: 'Approved', count: quoteCounts.approved, fill: '#10B981' },
            { status: 'Rejected', count: quoteCounts.rejected, fill: '#EF4444' },
            { status: 'Cancelled', count: quoteCounts.cancelled, fill: '#9CA3AF' },
        ];
        // Format month names
        const formattedRevenueByMonth = revenueByMonth.map((r) => {
            let monthDate;
            if (r.month) {
                monthDate = new Date(r.month);
                if (isNaN(monthDate.getTime())) {
                    // If date parsing fails, try to extract from string
                    const match = r.month.match(/\d{4}-\d{2}/);
                    if (match) {
                        monthDate = new Date(match[0] + '-01');
                    }
                    else {
                        monthDate = new Date();
                    }
                }
            }
            else {
                monthDate = new Date();
            }
            return {
                month: monthDate.toLocaleDateString('en-NG', { month: 'short', year: '2-digit' }),
                revenue: Number(r.revenue || 0),
            };
        });
        const formattedQuotesByMonth = quotesByMonth.map((q) => {
            let monthDate;
            if (q.month) {
                monthDate = new Date(q.month);
                if (isNaN(monthDate.getTime())) {
                    const match = q.month.match(/\d{4}-\d{2}/);
                    if (match) {
                        monthDate = new Date(match[0] + '-01');
                    }
                    else {
                        monthDate = new Date();
                    }
                }
            }
            else {
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
                topItems: topItems.map((i) => ({
                    name: i.itemName,
                    timesQuoted: Number(i.timesQuoted || 0),
                    totalValue: Number(i.totalValue || 0),
                })),
            },
        });
    }
    catch (error) {
        console.error('Dashboard Error:', error);
        next(error);
    }
};
exports.getDashboardStats = getDashboardStats;
//# sourceMappingURL=dashboard.controller.js.map