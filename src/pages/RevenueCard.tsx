import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { createClient } from '@supabase/supabase-js';
import { ApexOptions } from 'apexcharts'; // ✅ Import ApexOptions type

// ✅ Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface RevenueChartProps {
    isDark: boolean;
    isRtl: boolean;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ isDark, isRtl }) => {
    const [salesData, setSalesData] = useState<number[]>(Array(12).fill(0));
    const [invoiceData, setInvoiceData] = useState<number[]>(Array(12).fill(0));
    const [totalSales, setTotalSales] = useState<number>(0);
    const [totalInvoices, setTotalInvoices] = useState<number>(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // ✅ Fetch authenticated user
                const { data: authData, error: authError } = await supabase.auth.getUser();
                if (authError || !authData?.user?.email) {
                    console.error('User not authenticated:', authError);
                    return;
                }

                const userEmail = authData.user.email;
                const currentYear = new Date().getFullYear();

                // ✅ Fetch orders for the logged-in user's company
                const { data: orders, error: orderError } = await supabase
                    .from('orders')
                    .select('order_date, order_total')
                    .eq('order_company_email', userEmail);

                if (orderError) {
                    throw new Error(`Error fetching orders: ${orderError.message}`);
                }

                // ✅ Fetch invoices for the logged-in user's company
                const { data: invoices, error: invoiceError } = await supabase
                    .from('invoices')
                    .select('inv_due_date, inv_total')
                    .eq('inv_company_email', userEmail);

                if (invoiceError) {
                    throw new Error(`Error fetching invoices: ${invoiceError.message}`);
                }

                // ✅ Aggregate sales & invoices by month
                const salesByMonth = Array(12).fill(0);
                const invoicesByMonth = Array(12).fill(0);
                let yearlySalesTotal = 0;
                let yearlyInvoiceTotal = 0;

                orders.forEach((order) => {
                    const orderDate = new Date(order.order_date);
                    if (orderDate.getFullYear() === currentYear) {
                        const monthIndex = orderDate.getMonth();
                        salesByMonth[monthIndex] += parseFloat(order.order_total || '0');
                        yearlySalesTotal += parseFloat(order.order_total || '0');
                    }
                });

                invoices.forEach((invoice) => {
                    const invoiceDate = new Date(invoice.inv_due_date);
                    if (invoiceDate.getFullYear() === currentYear) {
                        const monthIndex = invoiceDate.getMonth();
                        invoicesByMonth[monthIndex] += parseFloat(invoice.inv_total || '0');
                        yearlyInvoiceTotal += parseFloat(invoice.inv_total || '0');
                    }
                });

                setSalesData(salesByMonth);
                setInvoiceData(invoicesByMonth);
                setTotalSales(yearlySalesTotal);
                setTotalInvoices(yearlyInvoiceTotal);

            } catch (error) {
                console.error('Error fetching revenue data:', error);
            }
        };

        fetchData();
    }, []);

    // ✅ Fix Type Issue with Explicit Cast
    const revenueChart: ApexOptions = {
        chart: {
            height: 325,
            type: 'area' as 'area', // ✅ Explicitly cast the chart type
            fontFamily: 'Nunito, sans-serif',
            zoom: { enabled: false },
            toolbar: { show: false },
        },
        dataLabels: { enabled: false },
        stroke: {
            show: true,
            curve: 'smooth',
            width: 2,
            lineCap: 'square',
        },
        colors: isDark ? ['#2196F3', '#F39C12'] : ['#1B55E2', '#FFA500'],
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        xaxis: {
            axisBorder: { show: false },
            axisTicks: { show: false },
            crosshairs: { show: true },
            labels: {
                offsetX: isRtl ? 2 : 0,
                offsetY: 5,
                style: { fontSize: '12px', cssClass: 'apexcharts-xaxis-title' },
            },
        },
        yaxis: {
            tickAmount: 7,
            labels: {
                formatter: (value: number) => `Rs ${value.toLocaleString()}`,
                offsetX: isRtl ? -30 : -10,
                style: { fontSize: '12px', cssClass: 'apexcharts-yaxis-title' },
            },
            opposite: isRtl,
        },
        grid: {
            borderColor: isDark ? '#191E3A' : '#E0E6ED',
            strokeDashArray: 5,
            xaxis: { lines: { show: true } },
            yaxis: { lines: { show: false } },
            padding: { top: 0, right: 0, bottom: 0, left: 0 },
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            fontSize: '16px',
            markers: { width: 10, height: 10, offsetX: -2 },
            itemMargin: { horizontal: 10, vertical: 5 },
        },
        tooltip: { marker: { show: true }, x: { show: false } },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                inverseColors: false,
                opacityFrom: isDark ? 0.19 : 0.28,
                opacityTo: 0.05,
                stops: isDark ? [100, 100] : [45, 100],
            },
        },
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold dark:text-[#32a8a4]">Total Sales & Invoices This Year</h2>
                <div className="text-right">
                    <p className="text-lg font-bold dark:text-[#32a8a4]">Sales: Rs {totalSales.toLocaleString()}</p>
                    <p className="text-lg font-bold dark:text-[#F39C12]">Invoices: Rs {totalInvoices.toLocaleString()}</p>
                </div>
            </div>
            <ReactApexChart series={[
                { name: 'Sales', data: salesData },
                { name: 'Invoices', data: invoiceData }
            ]} options={revenueChart} type="area" height={325} />
        </div>
    );
};

export default RevenueChart;
