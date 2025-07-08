import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import { setPageTitle } from '../../store/themeConfigSlice';
import ReactApexChart from 'react-apexcharts';
import { createClient } from '@supabase/supabase-js';
import { ApexOptions } from 'apexcharts';
import { FaTicketAlt, FaMoneyBillWave } from 'react-icons/fa';

const supabase = createClient(
  import.meta.env.VITE_REACT_APP_SUPABASE_URL,
  import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
  const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass === 'rtl');

  const [stats, setStats] = useState({
    users: 0,
    concerts: 0,
    ticketsBooked: 0,
    ticketsPaid: 0,
    ticketsUnpaid: 0,
    revenue: 0,
  });

  const [salesData, setSalesData] = useState<number[]>(Array(7).fill(0));
  const [dailyBookings, setDailyBookings] = useState<number[]>(Array(7).fill(0));
  const [totalSales, setTotalSales] = useState<number>(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [ticketsPaidDetails, setTicketsPaidDetails] = useState<
    {
      concert: string;
      tickets: {
        ticketName: string;
        quantitySold: number;
        quantityAvailable: number;
        quantityRemaining: number;
      }[];
    }[]
  >([]);


  useEffect(() => {
    dispatch(setPageTitle('Dashboard'));
    fetchStats();
    fetchWeeklySales();
  }, [currentDate]);

  const fetchStats = async () => {
    const [users, concerts, bookings, tickets] = await Promise.all([
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('concerts').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select(`id, total, status, concertid, tickets`),
      supabase.from('tickets').select('id, ticket_name, quantity'),
    ]);

    const { data: concertList } = await supabase.from('concerts').select('id, concert_name');
    const paidBookings = bookings.data?.filter(t => t.status === true) || [];

    const groupedTickets: Record<string, Record<string, { sold: number; available: number }>> = {};

    // Step 1: Group all tickets under each concert with initial zero values
    concertList?.forEach(concert => {
      groupedTickets[concert.concert_name] = {};
      tickets.data?.forEach(ticket => {
        const ticketName = ticket.ticket_name?.trim() || 'Unknown Ticket';
        const quantityAvailable = parseInt(ticket.quantity ?? '0', 10);

        groupedTickets[concert.concert_name][ticketName] = {
          sold: 0,
          available: quantityAvailable,
        };
      });
    });

    // Step 2: Add sold count from paid bookings
    paidBookings.forEach(booking => {
      const concertName =
        concertList?.find(c => String(c.id) === String(booking.concertid))?.concert_name ?? 'Unknown Concert';

      (booking.tickets || []).forEach((ticket: any) => {
        const ticketMeta = tickets.data?.find(t => String(t.id) === String(ticket.ticket_id));
        const ticketName = ticketMeta?.ticket_name?.trim() || 'Unknown Ticket';
        const quantitySold = parseInt(ticket.quantity ?? '0', 10);

        // Update sold count if the ticket exists in the grouped data
        if (groupedTickets[concertName] && groupedTickets[concertName][ticketName]) {
          groupedTickets[concertName][ticketName].sold += quantitySold;
        }
      });
    });



    const ticketsPaidDetails = Object.entries(groupedTickets).map(([concert, tickets]) => ({
      concert,
      tickets: Object.entries(tickets).map(([ticketName, data]) => ({
        ticketName,
        quantitySold: data.sold,
        quantityAvailable: data.available,
        quantityRemaining: data.available - data.sold,
      })),
    }));


    const ticketsPaid = ticketsPaidDetails.reduce(
      (sum, group) => sum + group.tickets.reduce((s, t) => s + t.quantitySold, 0),
      0
    );

    const revenue = paidBookings.reduce((sum, t) => {
      const total = typeof t.total === 'string' ? parseFloat(t.total) : Number(t.total);
      return sum + (isNaN(total) ? 0 : total);
    }, 0);

    setStats({
      users: users.count || 0,
      concerts: concerts.count || 0,
      ticketsBooked: bookings.data?.length || 0,
      ticketsPaid,
      ticketsUnpaid: bookings.data?.filter(t => t.status === false).length || 0,
      revenue,
    });

    setTicketsPaidDetails(ticketsPaidDetails);
  };

  const getWeekRange = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(start.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { monday, sunday };
  };

  const fetchWeeklySales = async () => {
    const { monday, sunday } = getWeekRange(currentDate);
    const from = monday.toISOString().split('T')[0];
    const to = sunday.toISOString().split('T')[0];

    const { data: bookings } = await supabase
      .from('bookings')
      .select('created_at, total, status')
      .gte('created_at', from)
      .lte('created_at', to);

    const dailySales = Array(7).fill(0);
    const dailyCounts = Array(7).fill(0);
    let total = 0;

    bookings?.forEach((booking) => {
      const date = new Date(booking.created_at);
      const dayIndex = (date.getDay() + 6) % 7;

      const value = parseFloat(booking.total ?? '0');
      if (!isNaN(value)) {
        if (booking.status) {
          dailySales[dayIndex] += value;
          total += value;
        }
      }

      dailyCounts[dayIndex] += 1; // Count every booking
    });

    setSalesData(dailySales);
    setTotalSales(total);
    setDailyBookings(dailyCounts);
  };


  const getWeekLabels = (monday: Date): string[] => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const weekday = day.toLocaleDateString(undefined, { weekday: 'short' });
      const datePart = day.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' });
      return `${weekday} (${datePart})`;
    });
  };

  const StatCard = ({
    title,
    value,
    icon,
    bgColor,
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    bgColor: string;
  }) => (
    <div className={`p-4 rounded-xl shadow-md flex items-center space-x-4 transition hover:scale-[1.02] duration-200 ${bgColor}`}>
      <div className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-inner">{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{value}</h3>
      </div>
    </div>
  );

  const { monday, sunday } = getWeekRange(currentDate);

  const bookingsOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 200,
      toolbar: { show: false },
      fontFamily: 'Nunito, sans-serif',
    },
    colors: isDark ? ['#6366f1'] : ['#4338ca'],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '50%',
        borderRadius: 5,
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: getWeekLabels(getWeekRange(currentDate).monday),
      labels: {
        rotate: -45,
        formatter: (val: string) => val.split(' ')[0],
        style: { fontSize: '11px' },
      },
    },
    yaxis: {
      labels: {
        style: { fontSize: '11px' },
      },
      title: {
        text: 'Bookings',
        style: { fontSize: '12px' },
      },
      opposite: isRtl,
    },
    grid: {
      borderColor: isDark ? '#191E3A' : '#E0E6ED',
      strokeDashArray: 5,
    },
    tooltip: {
      y: { formatter: (val: number) => `${val} booking${val === 1 ? '' : 's'}` },
    },
  };


  return (
    <div className="flex justify-center">
      <div className="w-full max-w-7xl p-6 space-y-8">
        <h1 className="text-2xl font-bold text-center">Dashboard</h1>

        {/* Stat Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Tickets Bought"
            value={stats.ticketsPaid}
            icon={<FaTicketAlt className="text-green-500 text-2xl" />}
            bgColor="bg-green-100 dark:bg-green-900"
          />
          <StatCard
            title="Revenue (MUR)"
            value={`Rs ${stats.revenue.toLocaleString()}`}
            icon={<FaMoneyBillWave className="text-yellow-500 text-2xl" />}
            bgColor="bg-yellow-100 dark:bg-yellow-900"
          />
        </div>

        {/* Paid Tickets Breakdown */}
        <div className={`panel p-5 rounded-lg shadow transition-colors border ${isDark ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-gray-800 border-gray-200'}`}>
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-lg font-semibold">🎟️ Paid Tickets Breakdown</h2>
            {stats.ticketsPaid > 0 && (
              <p className="text-sm font-medium text-primary-600 dark:text-primary-400">
                Total: <span className="font-semibold">{stats.ticketsPaid}</span> tickets
              </p>
            )}
          </div>

          <div className="text-sm max-h-64 overflow-y-auto space-y-6">
            {ticketsPaidDetails.length === 0 ? (
              <p className="text-gray-400 italic">No paid tickets available this week.</p>
            ) : (
              ticketsPaidDetails.map((concertGroup, idx) => (
                <div key={idx} className="pb-4 border-b border-dashed border-gray-300 dark:border-gray-600/40">
                  <p className="text-lg font-semibold text-primary-700 dark:text-primary-400 mb-2">
                    🎶 {concertGroup.concert}
                  </p>

                  <div className="flex flex-wrap gap-3 ml-2">
                    {concertGroup.tickets.map((ticket, tIdx) => (
                      <div
                        key={tIdx}
                        className="flex flex-col px-3 py-2 bg-blue-100 dark:bg-blue-800/40 text-blue-900 dark:text-blue-100 rounded-md text-xs font-medium shadow-sm min-w-[160px] border border-blue-200 dark:border-blue-600"
                      >
                        <span className="font-semibold mb-1">🎫 {ticket.ticketName}</span>
                        <span className="text-[11px]">
                          Sold: <span className="font-semibold">{ticket.quantitySold}</span>
                        </span>
                        <span className="text-[11px] text-green-700 dark:text-green-400 mt-0.5">
                          Left: <span className="font-semibold">{ticket.quantityAvailable}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
