import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { FaTicketAlt, FaMoneyBillWave, FaEnvelope } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const supabase = createClient(
  import.meta.env.VITE_REACT_APP_SUPABASE_URL,
  import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY
);

interface Ticket {
  id: number;
  ticket_name: string;
  price: string;
  quantity: string;
  concert_id: string;
  sold?: number;
}

const TicketDashboard = () => {
  const [ticketsSold, setTicketsSold] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [ticketList, setTicketList] = useState<Ticket[]>([]);
  const loggedInEmail = localStorage.getItem('loggedInEmail') || 'Unknown';
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('status, concertid, total, tickets');

      let concertId: number | null = null;
      if (loggedInEmail === 'mazzika@zeko.com') concertId = 6;
      else if (loggedInEmail === 'yatch@zeko.com') concertId = 13;

      const filtered = bookings?.filter(
        b => b.status === true && String(b.concertid) === String(concertId)
      ) || [];

      const totalSold = filtered.reduce((sum, b) => {
        return sum + (b.tickets || []).reduce((tSum: number, t: { quantity: any }) => tSum + parseInt(t.quantity || '0', 10), 0);
      }, 0);

      const revenue = filtered.reduce((sum, b) => {
        const total = typeof b.total === 'string' ? parseFloat(b.total) : Number(b.total);
        return sum + (isNaN(total) ? 0 : total);
      }, 0);

      setTicketsSold(totalSold);
      setTotalRevenue(revenue);

      const { data: tickets } = await supabase
        .from('tickets')
        .select('*')
        .eq('concert_id', concertId);

      const enrichedTickets = (tickets || []).map((ticket: Ticket) => {
        const soldCount = filtered.reduce((sum, b) => {
          const matching = (b.tickets || []).filter((t: any) => t.ticket_id === ticket.id);
          return sum + matching.reduce((s: number, t: { quantity: any }) => s + parseInt(t.quantity || '0', 10), 0);
        }, 0);
        return { ...ticket, sold: soldCount };
      });

      setTicketList(enrichedTickets);
    };

    fetchStats();
  }, []);

  const Card = ({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string | number; bg: string }) => (
    <div className={`flex items-center gap-4 p-5 rounded-xl shadow-lg ${bg} text-white`}>
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-sm uppercase tracking-wider">{label}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle,_#000_1px,_transparent_1px)] [background-size:16px_16px] p-6">
      <div className="w-full max-w-6xl space-y-10 bg-white/80 backdrop-blur-md rounded-xl shadow-lg p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">ZEKO CLIENT DASHBOARD</h1>
          <button
            onClick={() => {
              localStorage.clear();
              navigate('/');
            }}
            className="mt-4 sm:mt-0 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 px-4 rounded-lg shadow transition"
          >
            Logout
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
          <Card icon={<FaEnvelope />} label="Logged In" value={loggedInEmail} bg="bg-blue-500" />
          <Card icon={<FaTicketAlt />} label="Tickets Sold" value={ticketsSold} bg="bg-green-500" />
          <Card icon={<FaMoneyBillWave />} label="Revenue" value={`Rs ${totalRevenue.toLocaleString()}`} bg="bg-yellow-500" />
        </div>

        {/* Ticket Breakdown Table */}
        <div className="shadow-md rounded-lg p-6 overflow-x-auto bg-white">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 text-center">🎫 Ticket Breakdown</h2>
          {ticketList.length === 0 ? (
            <p className="text-gray-500 italic text-center">No ticket data available for this concert.</p>
          ) : (
            <table className="min-w-full border border-gray-300 text-sm">
              <thead className="bg-[#011d4a] text-black uppercase tracking-wider">
                <tr>
                  <th className="p-2 border">Ticket Name</th>
                  <th className="p-2 border">Price (Rs)</th>
                  <th className="p-2 border">Sold</th>
                  <th className="p-2 border">Left</th>
                </tr>
              </thead>
              <tbody>
                {loggedInEmail === 'mazzika@zeko.com' && (
                  <tr className="text-center text-gray-700 font-semibold bg-blue-50">
                    <td className="p-2 border">Early Birds</td>
                    <td className="p-2 border">1000</td>
                    <td className="p-2 border">231</td>
                    <td className="p-2 border">0</td>
                  </tr>
                )}
                {ticketList.map(ticket => (
                  <tr key={ticket.id} className="text-center text-gray-700">
                    <td className="p-2 border">{ticket.ticket_name}</td>
                    <td className="p-2 border">{ticket.price}</td>
                    <td className="p-2 border">{ticket.sold}</td>
                    <td className="p-2 border">{ticket.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );

};

export default TicketDashboard;
