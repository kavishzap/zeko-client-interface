import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { createClient } from '@supabase/supabase-js';
import { Edit, Delete } from '@mui/icons-material';

const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AdminManagement = () => {
    const dispatch = useDispatch();
    const [admins, setAdmins] = useState<any[]>([]);
    const [filteredAdmins, setFilteredAdmins] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({ id: null, fname: '', lname: '', email: '', password: '' });

    useEffect(() => {
        dispatch(setPageTitle('Admin Management'));
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('admin').select('*');
            if (error) throw error;
            setAdmins(data || []);
            setFilteredAdmins(data || []);
        } catch (error) {
            console.error('Error fetching admins:', error);
            Swal.fire('Error', 'Failed to load admins.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const results = admins.filter((admin) =>
            admin.email.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredAdmins(results);
    }, [search, admins]);

    const openModal = (admin: any = null) => {
        if (admin) {
            setFormData(admin);
        } else {
            setFormData({ id: null, fname: '', lname: '', email: '', password: '' });
        }
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        const { id, ...data } = formData;
        try {
            if (!data.fname || !data.lname || !data.email || !data.password) {
                Swal.fire('Validation Error', 'All fields are required.', 'warning');
                return;
            }

            if (id) {
                const { error } = await supabase.from('admin').update(data).eq('id', id);
                if (error) throw error;
                Swal.fire('Success', 'Admin updated.', 'success');
            } else {
                const { error } = await supabase.from('admin').insert([data]);
                if (error) throw error;
                Swal.fire('Success', 'Admin added.', 'success');
            }
            fetchAdmins();
            setModalOpen(false);
        } catch (error) {
            console.error('Error saving admin:', error);
            Swal.fire('Error', 'Operation failed.', 'error');
        }
    };

    const deleteAdmin = async (id: number) => {
        const confirm = await Swal.fire({
            title: 'Are you sure?',
            text: 'This will permanently delete the admin.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
        });

        if (confirm.isConfirmed) {
            try {
                const { error } = await supabase.from('admin').delete().eq('id', id);
                if (error) throw error;
                Swal.fire('Deleted!', 'Admin has been deleted.', 'success');
                fetchAdmins();
            } catch (error) {
                console.error('Delete failed:', error);
                Swal.fire('Error', 'Failed to delete admin.', 'error');
            }
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Admin Management</h2>
                <button className="btn btn-primary" onClick={() => openModal()}>Add Admin</button>
            </div>

            <input
                type="text"
                className="form-input mb-4 w-full"
                placeholder="Search by email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {loading ? (
                <p>Loading...</p>
            ) : filteredAdmins.length === 0 ? (
                <p>No admins found.</p>
            ) : (
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Email</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAdmins.map((admin) => (
                            <tr key={admin.id}>
                                <td>{admin.id}</td>
                                <td>{admin.fname}</td>
                                <td>{admin.lname}</td>
                                <td>{admin.email}</td>
                                <td className="flex gap-2 justify-center">
                                    <button className="btn btn-sm btn-outline-primary" onClick={() => openModal(admin)}>
                                        <Edit fontSize="small" />
                                    </button>
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => deleteAdmin(admin.id)}>
                                        <Delete fontSize="small" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Modal */}
            <Transition appear show={modalOpen} as={Fragment}>
                <Dialog as="div" onClose={() => setModalOpen(false)} className="relative z-[51]">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/50" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center px-4 py-8">
                            <Dialog.Panel className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-md p-6">
                                <Dialog.Title className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                                    {formData.id ? 'Edit Admin' : 'Add Admin'}
                                </Dialog.Title>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">First Name</label>
                                        <input
                                            className="form-input w-full bg-white dark:bg-[#1e293b] text-black dark:text-white border border-gray-300 dark:border-gray-600"
                                            placeholder="First Name"
                                            value={formData.fname}
                                            onChange={(e) => setFormData({ ...formData, fname: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Last Name</label>
                                        <input
                                            className="form-input w-full bg-white dark:bg-[#1e293b] text-black dark:text-white border border-gray-300 dark:border-gray-600"
                                            placeholder="Last Name"
                                            value={formData.lname}
                                            onChange={(e) => setFormData({ ...formData, lname: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
                                        <input
                                            type="email"
                                            className="form-input w-full bg-white dark:bg-[#1e293b] text-black dark:text-white border border-gray-300 dark:border-gray-600"
                                            placeholder="Email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Password</label>
                                        <input
                                            type="password"
                                            className="form-input w-full bg-white dark:bg-[#1e293b] text-black dark:text-white border border-gray-300 dark:border-gray-600"
                                            placeholder="Password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end mt-6 gap-2">
                                    <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                                    <button className="btn btn-primary" onClick={handleSubmit}>
                                        {formData.id ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </div>
                    </div>

                </Dialog>
            </Transition>
        </div>
    );
};

export default AdminManagement;
