import { useState, Fragment, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { Switch } from '@headlessui/react';
import { Visibility, Delete } from '@mui/icons-material';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const Orders = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Orders'));
    });

    const [orderList, setOrderList] = useState<any[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>('');
    const [viewOrder, setViewOrder] = useState<any | null>(null);

    // ✅ Pagination States
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 10; // Show 5 orders per page
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    const fetchOrders = useCallback(async () => {
        Swal.fire({
            title: 'Fetching orders details...',
            text: 'Please wait while we load your details.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });
        try {
            // ✅ Fetch the authenticated user
            const { data: authData, error: authError } = await supabase.auth.getUser();

            if (authError || !authData?.user?.email) {
                console.error('User not authenticated:', authError);
                setLoading(false);
                Swal.close();
                return;
            }

            const userEmail = authData.user.email;

            // ✅ Fetch orders only for the logged-in user's company
            const { data, error } = await supabase.from('orders').select('*').eq('order_company_email', userEmail); // ✅ Query by authenticated user's email

            if (error) {
                throw new Error(`Error fetching orders: ${error.message}`);
            }

            if (!data || data.length === 0) {
                console.warn('No orders found for this user.');
                setOrderList([]);
                setFilteredOrders([]);
                Swal.close();
                setLoading(false);
                return;
            }

            // ✅ Parse the order items field from JSON
            const orders = data
                .map((order) => ({
                    ...order,
                    order_items: JSON.parse(order.order_items),
                }))
                .sort((a, b) => b.id - a.id); // Sort descending by id

            setOrderList(orders);
            setFilteredOrders(orders);

            Swal.close();
        } catch (error) {
            console.error('Unexpected error fetching orders:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch details. Please try again later.',
                confirmButtonText: 'OK',
            });
        } finally {
            setLoading(false);
            Swal.close();
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        const filtered = orderList.filter((order) => order?.id?.toString().includes(search.toLowerCase())).sort((a, b) => b.id - a.id); // Sort again to ensure order

        setFilteredOrders(filtered);
        setCurrentPage(1); // Reset to first page on new search
    }, [search, orderList]);

    const deleteOrder = async (order: any) => {
        const confirm = await Swal.fire({
            title: `Are you sure you want to delete Order #${order.id}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Delete',
        });

        if (confirm.isConfirmed) {
            try {
                // ✅ DELETE order using Supabase client
                const { error } = await supabase.from('orders').delete().eq('id', order.id);

                if (error) {
                    throw new Error(`Error deleting order: ${error.message}`);
                }

                // ✅ Remove order from state after successful deletion
                setOrderList((prevList) => prevList.filter((o) => o.id !== order.id));
                setFilteredOrders((prevList) => prevList.filter((o) => o.id !== order.id));

                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'The order has been deleted successfully.',
                    timer: 3000,
                    showConfirmButton: false,
                });
            } catch (error) {
                console.error('Error deleting order:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to delete order. Please try again later.',
                    timer: 3000,
                    showConfirmButton: false,
                });
            }
        }
    };
    const toggleOrderStatus = async (order: any) => {
        try {
            const newStatus = !order.status; // Toggle status

            // ✅ Update order status in Supabase
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus }) // Updating status field
                .eq('id', order.id);

            if (error) {
                throw new Error(`Error updating status: ${error.message}`);
            }

            // ✅ Update local state immediately for better UX
            setOrderList((prevList) => prevList.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)));
            setFilteredOrders((prevList) => prevList.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)));

            Swal.fire({
                icon: 'success',
                title: 'Status Updated',
                text: `Order #${order.id} marked as ${newStatus ? 'Completed' : 'Pending'}.`,
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error('Error updating order status:', error);
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: 'Failed to update order status. Try again later.',
                timer: 3000,
                showConfirmButton: false,
            });
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-xl">Orders</h2>
                <div className="relative">
                    <input type="text" placeholder="Search by Order ID" className="form-input py-2 ltr:pr-11 rtl:pl-11 peer" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </div>
            <div className="mt-5 panel p-0 border-0 overflow-hidden">
                <div className="table-responsive">
                    {loading ? (
                        <p className="text-center py-5">Loading...</p>
                    ) : filteredOrders.length === 0 ? (
                        <p className="text-center py-5">No orders available</p>
                    ) : (
                        <table className="table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Order Date</th>
                                    <th>Order Items</th>
                                    <th>Order Total</th>
                                    <th>Profit</th>
                                    <th>Status</th>
                                    <th>Time of order</th>
                                    <th className="!text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((order) => (
                                    <tr key={order.id}>
                                        <td>{order.id}</td>
                                        <td>{new Date(order.order_date).toLocaleDateString()}</td>
                                        <td>{order.order_items?.map((item: any) => `${item.name} (x${item.quantity})`).join(', ')}</td>

                                        <td>Rs {parseFloat(order.order_total).toFixed(2)}</td>
                                        <td>Rs {parseFloat(order.order_profit).toFixed(2)}</td>
                                        <td>
                                            <Switch
                                                checked={order.status}
                                                onChange={() => toggleOrderStatus(order)} // ✅ Toggle function
                                                className={`${order.status ? 'bg-green-500' : 'bg-gray-300'}
                    relative inline-flex h-6 w-11 items-center rounded-full`}
                                            >
                                                <span className={`${order.status ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`} />
                                            </Switch>
                                        </td>
                                        <td>
                                            {order.created_at &&
                                                new Date(new Date(order.created_at).getTime() + 4 * 60 * 60 * 1000).toLocaleTimeString('en-GB', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: false,
                                                })}
                                        </td>
                                        <td>
                                            <div className="flex gap-4 items-center justify-center">
                                                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setViewOrder(order)}>
                                                    <Visibility className="w-5 h-5" />
                                                </button>
                                                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => deleteOrder(order)}>
                                                    <Delete className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* ✅ Pagination Controls */}
                {filteredOrders.length > itemsPerPage && (
                    <div className="flex justify-center mt-4">
                        <button
                            className={`px-4 py-2 border ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            className={`px-4 py-2 border ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* View Order Modal */}
            <Transition appear show={viewOrder !== null} as={Fragment}>
    <Dialog as="div" open={viewOrder !== null} onClose={() => setViewOrder(null)} className="relative z-[51]">
        <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
        >
            <div className="fixed inset-0 bg-[black]/60" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center px-4 py-8">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                >
                    <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg text-black dark:text-white-dark">
                        <button
                            type="button"
                            onClick={() => setViewOrder(null)}
                            className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
                        >
                            ✕
                        </button>

                        <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">
                            Order Summary
                        </div>

                        <div className="p-5">
                            {viewOrder && (
                                <div className="space-y-5">
                                    {/* Date */}
                                    <div className="mb-2">
                                        <label className="text-sm font-semibold block mb-1">Order Date</label>
                                        <p className="text-sm">
                                            {new Date(viewOrder.order_date).toLocaleDateString()}
                                        </p>
                                    </div>

                                    {/* Products List */}
                                    <div className="mb-2">
                                        <label className="text-sm font-semibold block mb-1">Products</label>
                                        <ul className="space-y-2 border border-gray-200 dark:border-gray-700 p-3 rounded">
                                            {viewOrder.order_items.map((item: any, index: number) => (
                                                <li key={index} className="flex justify-between text-sm">
                                                    <span>{item.name}</span>
                                                    <span>x{item.quantity}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Total */}
                                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Total:</span>
                                            <span>Rs {parseFloat(viewOrder.order_total).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Dialog.Panel>
                </Transition.Child>
            </div>
        </div>
    </Dialog>
</Transition>

        </div>
    );
};

export default Orders;
