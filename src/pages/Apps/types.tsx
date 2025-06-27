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

const TypeManagement = () => {
    const dispatch = useDispatch();
    const [types, setTypes] = useState<any[]>([]);
    const [filteredTypes, setFilteredTypes] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({ id: null, name: '' });
    const PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);


    useEffect(() => {
        dispatch(setPageTitle('Type Management'));
        fetchTypes();
    }, [currentPage, search]);


    const fetchTypes = async () => {
        setLoading(true);
        try {
            const from = (currentPage - 1) * PER_PAGE;
            const to = from + PER_PAGE - 1;

            const query = supabase
                .from('types')
                .select('*', { count: 'exact' })
                .range(from, to);

            if (search.trim()) {
                query.ilike('name', `%${search.trim()}%`);
            }

            const { data, count, error } = await query;

            if (error) throw error;

            setTypes(data || []);
            setTotalCount(count || 0);
        } catch (error) {
            console.error('Error fetching types:', error);
            Swal.fire('Error', 'Failed to load types.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (type: any = null) => {
        if (type) {
            setFormData(type);
        } else {
            setFormData({ id: null, name: '' });
        }
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        const { id, name } = formData;
        if (!name) {
            Swal.fire('Validation Error', 'Name is required.', 'warning');
            return;
        }

        try {
            if (id) {
                const { error } = await supabase.from('types').update({ name }).eq('id', id);
                if (error) throw error;
                Swal.fire('Success', 'Type updated.', 'success');
            } else {
                const { error } = await supabase.from('types').insert([{ name }]);
                if (error) throw error;
                Swal.fire('Success', 'Type added.', 'success');
            }
            fetchTypes();
            setModalOpen(false);
        } catch (error) {
            console.error('Save error:', error);
            Swal.fire('Error', 'Failed to save type.', 'error');
        }
    };

    const deleteType = async (id: number) => {
        const confirm = await Swal.fire({
            title: 'Are you sure?',
            text: 'This will delete the type.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
        });

        if (confirm.isConfirmed) {
            try {
                const { error } = await supabase.from('types').delete().eq('id', id);
                if (error) throw error;
                Swal.fire('Deleted!', 'Type deleted successfully.', 'success');
                fetchTypes();
            } catch (error) {
                console.error('Delete error:', error);
                Swal.fire('Error', 'Failed to delete type.', 'error');
            }
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Type Management</h2>
                <button className="btn btn-primary" onClick={() => openModal()}>Add Type</button>
            </div>

            <input
                type="text"
                className="form-input mb-4 w-full"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {loading ? (
                <p>Loading...</p>
            ) : types.length === 0 ? (
                <p>No types found.</p>
            ) : (
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {types.map((type) => (
                            <tr key={type.id}>

                                <td>{type.name}</td>
                                <td className="flex gap-2 justify-center">
                                    <button className="btn btn-sm btn-outline-primary" onClick={() => openModal(type)}>
                                        <Edit fontSize="small" />
                                    </button>
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => deleteType(type.id)}>
                                        <Delete fontSize="small" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>


            )}
            {totalCount > PER_PAGE && (
                <div className="flex justify-between items-center mt-4">
                    <button
                        className="btn btn-outline"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                        Previous
                    </button>
                    <span>
                        Page {currentPage} of {Math.ceil(totalCount / PER_PAGE)}
                    </span>
                    <button
                        className="btn btn-outline"
                        disabled={currentPage === Math.ceil(totalCount / PER_PAGE)}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                        Next
                    </button>
                </div>
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
                                    {formData.id ? 'Edit Type' : 'Add Type'}
                                </Dialog.Title>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Name</label>
                                        <input
                                            className="form-input w-full bg-white dark:bg-[#1e293b] text-black dark:text-white border border-gray-300 dark:border-gray-600"
                                            placeholder="Type name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

export default TypeManagement;
