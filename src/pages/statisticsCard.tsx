import React, { useEffect, useState } from 'react';
import IconNotes from '../components/Icon/IconNotes';
import IconFile from '../components/Icon/IconShoppingBag';
import IconFile2 from '../components/Icon/IconShoppingCart';
import { createClient } from '@supabase/supabase-js';

// ✅ Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DashboardSummary: React.FC = () => {
    const [totalOrders, setTotalOrders] = useState<number>(0);
    const [totalOrdersThisMonth, setTotalOrdersThisMonth] = useState<number>(0);
    const [totalInvoices, setTotalInvoices] = useState<number>(0);
    const [profitThisYear, setProfitThisYear] = useState<number>(0);
    const [todaySales, setTodaySales] = useState({ day: 0, night: 0 });
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: authData, error: authError } = await supabase.auth.getUser();
                if (authError || !authData?.user?.email) {
                    console.error('User not authenticated:', authError);
                    return;
                }

                const userEmail = authData.user.email;
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth() + 1;
                const todayStr = now.toLocaleDateString('en-CA');

                const { data: orders, error: orderError } = await supabase.from('orders').select('order_date,order_total, order_profit, day, night').eq('order_company_email', userEmail);

                if (orderError) {
                    console.error('Error fetching orders:', orderError);
                    return;
                }

                setTotalOrders(orders.length);

                const totalOrderProfit = orders.reduce((acc, order) => acc + parseFloat(order.order_profit || '0'), 0);

                const monthlyOrders = orders.filter((order) => {
                    const orderDate = new Date(order.order_date);
                    return orderDate.getFullYear() === currentYear && orderDate.getMonth() + 1 === currentMonth;
                });

                setTotalOrdersThisMonth(monthlyOrders.length);

                const todayOrders = orders.filter(order => {
                    const dateOnly = new Date(order.order_date).toISOString().split('T')[0];
                    return dateOnly === todayStr;
                });

                let dayTotal = 0, nightTotal = 0;
                todayOrders.forEach(order => {
                    const total = parseFloat(order.order_total || '0');
                    if (order.day) dayTotal += total;
                    if (order.night) nightTotal += total;
                });

                setTodaySales({ day: dayTotal, night: nightTotal });

                // ✅ Fetch invoices
                const { data: invoices, error: invoiceError } = await supabase.from('invoices').select('id, inv_profit').eq('inv_company_email', userEmail);

                if (invoiceError) {
                    console.error('Error fetching invoices:', invoiceError);
                } else {
                    setTotalInvoices(invoices.length);
                    const totalInvoiceProfit = invoices.reduce((acc, invoice) => acc + parseFloat(invoice.inv_profit || '0'), 0);
                    setProfitThisYear(totalOrderProfit + totalInvoiceProfit);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-5">
            {/* ✅ Total Orders */}
            <div className="panel flex flex-col items-center justify-center text-center">
                <div className="mb-4">
                    <div className="text-lg font-bold mb-2 dark:text-[#32a8a4]">Total Orders</div>
                    <div className="dark:text-[#32a8a4] text-4xl">{totalOrders}</div>
                </div>
                <IconFile className="dark:text-[#32a8a4] opacity-80 w-24 h-24" />
            </div>

            {/* ✅ Orders This Month */}
            <div className="panel flex flex-col items-center justify-center text-center">
                <div className="mb-4">
                    <div className="text-lg font-bold mb-2 dark:text-[#32a8a4]">Total Orders This Month</div>
                    <div className="dark:text-[#32a8a4] text-4xl">{totalOrdersThisMonth}</div>
                </div>
                <IconFile2 className="dark:text-[#32a8a4] opacity-80 w-24 h-24" />
            </div>

            <div className="panel flex flex-col items-center justify-center text-center">
                <div className="mb-4">
                    <div className="text-lg font-bold mb-2 dark:text-[#32a8a4]">Sales Today</div>
                    <div className="dark:text-[#32a8a4] text-md">
                        Day Sales: <span className="font-bold">{todaySales.day.toFixed(2)}</span>
                    </div>
                    <div className="dark:text-[#32a8a4] text-md">
                        Night Sales: <span className="font-bold">{todaySales.night.toFixed(2)}</span>
                    </div>
                </div>
                <div className="dark:text-[#32a8a4] opacity-80 text-6xl">RS</div>
            </div>

            <div className="panel flex flex-col items-center justify-center text-center">
                <div className="mb-4">
                    <div className="text-lg font-bold mb-2 dark:text-[#32a8a4]">Profit This Year</div>
                    <div className="dark:text-[#32a8a4] text-4xl">{profitThisYear.toFixed(2)}</div>
                </div>
                <div className="dark:text-[#32a8a4] opacity-80 text-6xl">RS</div>
            </div>
        </div>
    );
};

export default DashboardSummary;
