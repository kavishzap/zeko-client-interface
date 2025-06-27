import { useEffect, useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { createClient } from '@supabase/supabase-js';
import { Edit, Delete } from '@mui/icons-material';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { ConcertService } from './ConcertService';

const supabase = createClient(
    import.meta.env.VITE_REACT_APP_SUPABASE_URL,
    import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY
);
interface ConcertFormData {
    concert_name: string;
    concert_date: string;
    concert_google_map_link: string;
    concert_location_name: string;
    concert_start_time: string;
    concert_end_time: string;
    concert_type: string;
    concert_description: string;
    concert_status: string;
    concert_image: string;
    front_image: string; // NEW
}

interface Type {
    name: string;
}

const ConcertManagement = () => {
    const dispatch = useDispatch();
    const [concerts, setConcerts] = useState<ConcertFormData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filteredConcerts, setFilteredConcerts] = useState<ConcertFormData[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [concertTypes, setConcertTypes] = useState<Type[]>([]);
    const [formData, setFormData] = useState<ConcertFormData>({
        concert_name: '',
        concert_date: '',
        concert_google_map_link: '',
        concert_location_name: '',
        concert_start_time: '',
        concert_end_time: '',
        concert_type: '',
        concert_description: '',
        concert_status: '',
        concert_image: '',
        front_image: '', // NEW
    });

    useEffect(() => {
        dispatch(setPageTitle('Concert Management'));
        fetchConcerts();
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        try {
            const { data, error } = await supabase.from('types').select('name');
            if (error) throw error;
            setConcertTypes(data || []);
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Failed to fetch concert types', 'error');
        }
    };


    const fetchConcerts = async () => {
        setLoading(true);
        try {
            const data = await ConcertService.getAll();

            // Handle case where `data` is null or undefined
            if (!data) {
                throw new Error('No concert data received.');
            }

            const parsedData = data.map((concert: any) => ({
                ...concert,
                concert_ticket_prices: JSON.parse(concert.concert_ticket_prices || '[]'),
            }));

            setConcerts(parsedData);
            setFilteredConcerts(parsedData);
        } catch (error: any) {
            console.error('Fetch concert error:', error);
            Swal.fire('Error', error?.message || 'Failed to fetch concerts', 'error');

            // Fallback to empty list to avoid UI being stuck
            setConcerts([]);
            setFilteredConcerts([]);
        } finally {
            setLoading(false); // ✅ Always stop loading
        }
    };



    useEffect(() => {
        const filtered = concerts.filter((concert) =>
            concert.concert_name.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredConcerts(filtered);
    }, [search, concerts]);

    const openModal = (concert: any = null) => {
        if (concert) {
            setFormData({
                concert_name: concert.concert_name,
                concert_date: concert.concert_date,
                concert_google_map_link: concert.concert_google_map_link,
                concert_location_name: concert.concert_location_name,
                concert_start_time: concert.concert_start_time,
                concert_end_time: concert.concert_end_time,
                concert_type: concert.concert_type,
                concert_description: concert.concert_description,
                concert_status: concert.concert_status ? 'Active' : 'Inactive',
                concert_image: concert.concert_image,
                front_image: concert.front_image || '', // NEW
            });
            setEditingId(concert.id);
        } else {
            setFormData({
                concert_name: '',
                concert_date: '',
                concert_google_map_link: '',
                concert_location_name: '',
                concert_start_time: '',
                concert_end_time: '',
                concert_type: '',
                concert_description: '',
                concert_status: '',
                concert_image: '',
                front_image: '',
            });
            setEditingId(null);
        }
        setModalOpen(true);
    };

    const handleImageUpload = async (files: FileList | null, key: 'concert_image' | 'front_image') => {
        if (!files || files.length === 0) return;
        const file = files[0];
        const reader = new FileReader();

        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            setFormData(prev => ({ ...prev, [key]: base64 }));
        };

        reader.onerror = () => {
            Swal.fire('Error', 'Failed to read image file.', 'error');
        };

        reader.readAsDataURL(file);
    };


    const handleSubmit = async () => {
        const {
            concert_name,
            concert_date,
            concert_google_map_link,
            concert_location_name,
            concert_start_time,
            concert_end_time,
            concert_type,
            concert_description,
            concert_status,
            concert_image,
            front_image,
        } = formData;

        if (
            !concert_name || !concert_date || !concert_google_map_link ||
            !concert_location_name || !concert_start_time || !concert_end_time ||
            !concert_type || !concert_description || !concert_status || !concert_image
        ) {
            Swal.fire('Validation Error', 'Please fill in all fields.', 'warning');
            return;
        }

        const payload = {
            concert_name,
            concert_date,
            concert_google_map_link,
            concert_location_name,
            concert_start_time,
            concert_end_time,
            concert_type,
            concert_description,
            concert_status: concert_status === 'Active',
            concert_image,
            front_image,
        };

        try {
            if (editingId) {
                await ConcertService.update(editingId, payload);
            } else {
                await ConcertService.insert(payload);
            }

            Swal.fire('Success', 'Concert saved.', 'success');
            fetchConcerts();
            setModalOpen(false);
            setEditingId(null);
        } catch (error: any) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    const deleteConcert = async (id: number | null) => {
        if (!id) return;
        const confirm = await Swal.fire({
            title: 'Delete this concert?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Delete',
        });

        if (confirm.isConfirmed) {
            try {
                await ConcertService.remove(id);
                fetchConcerts();
            } catch (error: any) {
                Swal.fire('Error', error.message, 'error');
            }
        }
    };



    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Concert Management</h2>
                <button className="btn btn-primary" onClick={() => openModal()}>Add Concert</button>
            </div>

            <input
                type="text"
                className="form-input mb-4 w-full"
                placeholder="Search by concert name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            {loading ? (
                <p>Loading...</p>
            ) : (
                <table className="table table-striped w-full">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Date</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                            <th>Location</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Google Map</th>
                            <th>Image</th>
                            <th>Front Image</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredConcerts.map((concert: any) => (
                            <tr key={concert.id}>
                                <td>{concert.id}</td>
                                <td>{concert.concert_name}</td>
                                <td>{concert.concert_date}</td>
                                <td>{concert.concert_start_time}</td>
                                <td>{concert.concert_end_time}</td>
                                <td>{concert.concert_location_name}</td>
                                <td>{concert.concert_type}</td>
                                <td>{concert.concert_status ? 'Active' : 'Inactive'}</td>
                                <td>
                                    <a
                                        href={concert.concert_google_map_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 underline"
                                    >
                                        View Map
                                    </a>
                                </td>
                                <td>
                                    {concert.concert_image ? (
                                        <img
                                            src={`data:image/jpeg;base64,${concert.concert_image.split(' ')[0]}`}
                                            alt="Concert"
                                            className="w-12 h-12 object-cover rounded"
                                        />
                                    ) : (
                                        'N/A'
                                    )}
                                </td>
                                <td>
                                    {concert.front_image ? (
                                        <img
                                            src={`data:image/jpeg;base64,${concert.front_image.split(' ')[0]}`}
                                            alt="Front"
                                            className="w-12 h-12 object-cover rounded"
                                        />
                                    ) : (
                                        'N/A'
                                    )}
                                </td>

                                <td className="flex gap-2">
                                    <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => openModal(concert)}
                                    >
                                        <Edit fontSize="small" />
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => deleteConcert(concert.id)}
                                    >
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
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center px-4 py-8">
                            <Dialog.Panel className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-2xl p-6">
                                <Dialog.Title className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                                    {editingId ? 'Edit Concert' : 'Add Concert'}
                                </Dialog.Title>


                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Concert Name</label>
                                        <input className="form-input" value={formData.concert_name} onChange={(e) => setFormData({ ...formData, concert_name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Concert Date</label>
                                        <input type="date" className="form-input" value={formData.concert_date} onChange={(e) => setFormData({ ...formData, concert_date: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Start Time</label>
                                        <input type="time" className="form-input" value={formData.concert_start_time} onChange={(e) => setFormData({ ...formData, concert_start_time: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">End Time</label>
                                        <input type="time" className="form-input" value={formData.concert_end_time} onChange={(e) => setFormData({ ...formData, concert_end_time: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Location Name</label>
                                        <input className="form-input" value={formData.concert_location_name} onChange={(e) => setFormData({ ...formData, concert_location_name: e.target.value })} />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Google Map Link</label>
                                        <input className="form-input" value={formData.concert_google_map_link} onChange={(e) => setFormData({ ...formData, concert_google_map_link: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Concert Type</label>
                                        <select
                                            className="form-select w-full"
                                            value={formData.concert_type}
                                            onChange={(e) => setFormData({ ...formData, concert_type: e.target.value })}
                                        >
                                            <option value="">Select type</option>
                                            {concertTypes.map((type) => (
                                                <option key={type.name} value={type.name}>
                                                    {type.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>


                                    <div>
                                        <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Status</label>
                                        <select
                                            className="form-select w-full"
                                            value={formData.concert_status}
                                            onChange={(e) => setFormData({ ...formData, concert_status: e.target.value })}
                                        >
                                            <option value="">Select status</option>
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                    <div className="col-span-full">
                                        <label className="block text-sm text-gray-700 dark:text-gray-200 mb-2">Upload Images (Max 3)</label>
                                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files, 'concert_image')} />

                                    </div>
                                    <div className="col-span-full">
                                        <label className="block text-sm text-gray-700 dark:text-gray-200 mb-2">Upload Front Image</label>
                                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files, 'front_image')} />
                                    </div>
                                    <div className="col-span-full">
                                        <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Description</label>
                                        <textarea className="form-textarea w-full" rows={3} value={formData.concert_description} onChange={(e) => setFormData({ ...formData, concert_description: e.target.value })}></textarea>
                                    </div>
                                </div>

                                <button className="btn btn-primary" onClick={handleSubmit}>
                                    {editingId ? 'Update' : 'Create'}
                                </button>

                            </Dialog.Panel>
                        </div>
                    </div>
                </Dialog>
            </Transition>

        </div>
    );
};

export default ConcertManagement;
