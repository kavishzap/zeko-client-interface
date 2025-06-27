import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { format, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf'; // ✅ Import jsPDF
import 'jspdf-autotable'; // ✅ Import autoTable
import 'jspdf-autotable'; // ✅ Import autoTable
import CashIcon from '../../../components/Icon/IconCashBanknotes';
import CashIcon2 from '../../../components/Icon/IconShoppingCart';
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}


// ✅ Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const Reports: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [filterType, setFilterType] = useState<string>('monthly');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [totalProfit, setTotalProfit] = useState<number>(0);
    const [totalSales, setTotalSales] = useState<number>(0);

    useEffect(() => {
        fetchData();
    }, [filterType, startDate, endDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // ✅ Get authenticated user
            const { data: authData, error: authError } = await supabase.auth.getUser();
            if (authError || !authData?.user?.email) {
                console.error('User not authenticated:', authError);
                setLoading(false);
                return;
            }

            const userEmail = authData.user.email;

            // ✅ Define date filters
            let fromDate = new Date();
            let toDate = new Date();

            if (filterType === 'daily') {
                fromDate = new Date();
                toDate = new Date();
            } else if (filterType === 'monthly') {
                fromDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                toDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
            } else if (filterType === 'yearly') {
                fromDate = new Date(new Date().getFullYear(), 0, 1);
                toDate = new Date(new Date().getFullYear(), 11, 31);
            } else if (filterType === 'custom') {
                fromDate = new Date(startDate);
                toDate = new Date(endDate);
            }

            const formattedFromDate = format(fromDate, 'yyyy-MM-dd');
            const formattedToDate = format(toDate, 'yyyy-MM-dd');

            // ✅ Fetch Orders (Ensure orders is never null)
            const { data: orders, error: orderError } = await supabase
                .from('orders')
                .select('*')
                .eq('order_company_email', userEmail)
                .gte('order_date', formattedFromDate)
                .lte('order_date', formattedToDate);

            if (orderError) console.error('Error fetching orders:', orderError);

            // ✅ Fetch Invoices (Ensure invoices is never null)
            const { data: invoices = [], error: invoiceError } = await supabase
                .from('invoices')
                .select('*')
                .eq('inv_company_email', userEmail)
                .gte('inv_date', formattedFromDate)
                .lte('inv_date', formattedToDate);

            if (invoiceError) console.error('Error fetching invoices:', invoiceError);

            // ✅ Merge Data for Reporting
            const allData = [...(orders || []).map((o) => ({ type: 'Order', ...o })), ...(invoices || []).map((i) => ({ type: 'Invoice', ...i }))];

            // ✅ Calculate Total Profit and Sales
            const totalProfitCalc = allData.reduce((sum, item) => sum + parseFloat(item.order_profit || item.inv_profit || '0'), 0);
            const totalSalesCalc = allData.reduce((sum, item) => sum + parseFloat(item.order_total || item.inv_total || '0'), 0);

            setTotalProfit(totalProfitCalc);
            setTotalSales(totalSalesCalc);
            setData(allData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        setLoading(false);
    };

    // ✅ Export Data as PDF
    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text('Business Report', 14, 15);
        doc.setFontSize(12);
        doc.text(`Date Range: ${startDate || 'Start'} - ${endDate || 'End'}`, 14, 25);
        doc.text(`Total Sales: Rs ${totalSales.toFixed(2)}`, 14, 35);
        doc.text(`Total Profit: Rs ${totalProfit.toFixed(2)}`, 14, 45);

        doc.autoTable({
            startY: 55,
            head: [['Type', 'Date', 'Total', 'Profit']],
            body: data.map((item) => [
                item.type,
                format(parseISO(item.order_date || item.inv_date), 'dd-MM-yyyy'), // ✅ Pretty Date
                `Rs ${item.order_total || item.inv_total}`,
                `Rs ${item.order_profit || item.inv_profit}`,
            ]),
        });

        doc.save(`report_${filterType}.pdf`);
    };

    return (
        <div className="panel pt-5">
            <h1 className="text-xl mb-5">Reporting & Analytics</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="bg-white dark:bg-gray-900 shadow-md rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <CashIcon2 className="dark:text-[#32a8a4] opacity-80 w-24 h-24" />
                    <h2 className="text-2xl text-gray-500 dark:text-gray-400"> Total Sales: </h2>
                    <p className="text-2xl font-semibold text-gray-800 dark:text-white">Rs {totalSales.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 shadow-md rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <CashIcon className="dark:text-[#32a8a4] opacity-80 w-24 h-24" />
                    <h2 className="text-2xl text-gray-500 dark:text-gray-400">Total Profit: </h2>
                    <p className="text-2xl font-semibold text-gray-800 dark:text-white">Rs {totalProfit.toFixed(2)}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
                <div>
                    <label>Filter Type</label>
                    <select className="form-input" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                        <option value="daily">Daily</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="custom">Custom Date Range</option>
                    </select>
                </div>

                {filterType === 'custom' && (
                    <>
                        <div>
                            <label>Start Date</label>
                            <input type="date" className="form-input" onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div>
                            <label>End Date</label>
                            <input type="date" className="form-input" onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                    </>
                )}
            </div>


            <div className="mt-6 flex justify-end gap-2">
                <button type="button" className="btn btn-secondary flex items-center" onClick={exportToPDF}>
                    Download PDF
                </button>
            </div>
        </div>
    );
};

export default Reports;
