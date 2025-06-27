import { useState, Fragment, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconSearch from '../../components/Icon/IconSearch';
import IconX from '../../components/Icon/IconX';
import IconPlus from '../../components/Icon/IconPlus';
import axios from 'axios';
import { Visibility, Delete } from '@mui/icons-material';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Product {
    id: number | null;
    name: string;
    description: string;
    sellingPrice: string;
    manufacturedPrice: string;
    code: string;
    category: string;
    stock: string;
    image: string | File | null;
    day: boolean;
    evening: boolean;
}

interface Errors {
    name?: string;
    description?: string;
    sellingPrice?: string;
    manufacturedPrice?: string;
    code?: string;
    category?: string;
    stock?: string;
    image?: string;
}

const Products = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Products'));
    }, [dispatch]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    const [addProductModal, setAddProductModal] = useState(false);
    const [params, setParams] = useState<Product>({
        id: null,
        name: '',
        description: '',
        sellingPrice: '',
        manufacturedPrice: '',
        code: '',
        category: '',
        stock: '',
        image: null,
        day: false, // Change from 'false' (string) to false (boolean)
        evening: false, // Change from 'false' (string) to false (boolean)
    });

    const [errors, setErrors] = useState<Errors>({});
    const [search, setSearch] = useState('');
    const [productList, setProductList] = useState<Product[]>([]);
    const [filteredItems, setFilteredItems] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryList, setCategoryList] = useState<string[]>([]);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10); // Default: 5 per page

    //Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredItems.length > 0 ? filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : [];

    // Total pages
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
    // Fetch authenticated user
    const fetchUser = async () => {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
            console.error('Error fetching user:', error);
            return;
        }
        setUserEmail(data?.user?.email || null);
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchCategories = useCallback(async () => {
        if (!userEmail) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.from('categories').select('category_name').eq('category_company_email', userEmail);

            if (error) throw error;
            setCategoryList(data.map((item: any) => item.category_name));
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    }, [userEmail]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const fetchProducts = useCallback(async () => {
        if (!userEmail) return;
        setLoading(true);

        // ✅ Show Swal loading alert
        Swal.fire({
            title: 'Fetching Products...',
            text: 'Please wait while we load your products.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        try {
            const { data, error } = await supabase.from('products').select('*').eq('product_company_email', userEmail);

            if (error) throw error;

            // ✅ Ensure proper mapping of API response
            const formattedData = data.map((item: any) => ({
                id: item.id,
                name: item.product_name,
                description: item.product_description,
                sellingPrice: item.product_selling_price,
                manufacturedPrice: item.product_manufacturing_price,
                code: item.product_code,
                category: item.product_category,
                stock: item.product_qty,
                image: item.product_image, // Base64 image
                day: item.day === 'true', // Convert string "true"/"false" to boolean
                evening: item.evening === 'true', // Convert string "true"/"false" to boolean
            }));

            setProductList(formattedData);
            setFilteredItems(formattedData);
            Swal.close();
        } catch (error) {
            console.error('Error fetching products:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch products. Please try again later.',
                confirmButtonText: 'OK',
            });
        } finally {
            setLoading(false);
        }
    }, [userEmail]); // ✅ Ensure it's re-run when userEmail changes

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const changeValue = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value, files, type, checked } = e.target as HTMLInputElement;
        setParams({
            ...params,
            [id]: type === 'checkbox' ? checked : files && files.length > 0 ? files[0] : value,
        });
        setErrors((prevErrors) => ({ ...prevErrors, [id]: undefined }));
    };

    useEffect(() => {
        const filtered = productList.filter((item) => item?.name?.toLowerCase().includes(search.toLowerCase().trim()));
        setFilteredItems(filtered);
        setCurrentPage(1); // Ensure pagination resets when filtering
    }, [search, productList]);

    const toBase64Thumbnail = (file: File, maxWidth = 75, maxHeight = 75): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (event) => {
                img.src = event.target?.result as string;
            };

            img.onload = () => {
                const canvas = document.createElement('canvas');

                const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
                const width = img.width * scale;
                const height = img.height * scale;

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.6); // Adjust quality (0.0–1.0)
                    resolve(resizedDataUrl.split(',')[1]); // Remove data:image prefix
                } else {
                    reject(new Error('Canvas not supported'));
                }
            };

            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    };

    const saveProduct = async () => {
        if (!userEmail) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No authenticated user. Please log in again.',
                timer: 3000,
                showConfirmButton: false,
            });
            return;
        }

        // Validate required fields
        const missingFields = [];
        if (!params.name) missingFields.push('Product Name');
        if (!params.description) missingFields.push('Description');
        if (!params.sellingPrice) missingFields.push('Selling Price');
        if (!params.manufacturedPrice) missingFields.push('Manufactured Price');
        if (!params.code) missingFields.push('Product Code');
        if (!params.category) missingFields.push('Category');
        if (!params.stock) missingFields.push('Stock');
        if (!params.image) missingFields.push('Product Image');

        if (missingFields.length > 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Fields',
                html: `Please fill the following fields:<br><strong>${missingFields.join(', ')}</strong>`,
                timer: 4000,
                showConfirmButton: false,
            });
            return;
        }

        try {
            let base64Image = null;

            if (params.image instanceof File) {
                base64Image = await toBase64Thumbnail(params.image);
            } else if (typeof params.image === 'string') {
                base64Image = params.image; // existing base64 image string
            }

            const payload = {
                product_company_email: userEmail,
                product_name: params.name,
                product_description: params.description,
                product_selling_price: params.sellingPrice,
                product_manufacturing_price: params.manufacturedPrice,
                product_code: params.code,
                product_category: params.category,
                product_qty: params.stock,
                product_image: base64Image,
                day: params.day,
                evening: params.evening,
            };

            if (params.id) {
                await supabase.from('products').update(payload).eq('id', params.id);
            } else {
                await supabase.from('products').insert([payload]);
            }

            Swal.fire({
                icon: 'success',
                title: params.id ? 'Product Updated' : 'Product Added',
                text: params.id ? 'The product has been updated successfully.' : 'The product has been added successfully.',
                timer: 3000,
                showConfirmButton: false,
            });

            // Reset Form
            setParams({
                id: null,
                name: '',
                description: '',
                sellingPrice: '',
                manufacturedPrice: '',
                code: '',
                category: '',
                stock: '',
                image: null,
                day: false, // Change from 'false' (string) to false (boolean)
                evening: false, // Change from 'false' (string) to false (boolean)
            });

            setAddProductModal(false);
            fetchProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to save product. Please try again later.',
                timer: 3000,
                showConfirmButton: false,
            });
        }
    };

    const deleteProduct = async (product: Product) => {
        if (!userEmail) return;

        const confirm = await Swal.fire({
            title: `Are you sure you want to delete ${product.name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Delete',
        });

        if (confirm.isConfirmed) {
            try {
                await supabase.from('products').delete().eq('id', product.id);
                setProductList((prevList) => prevList.filter((p) => p.id !== product.id));
                setFilteredItems((prevList) => prevList.filter((p) => p.id !== product.id));

                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'The product has been deleted successfully.',
                    timer: 3000,
                    showConfirmButton: false,
                });
            } catch (error) {
                console.error('Error deleting product:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to delete product. Please try again later.',
                    timer: 3000,
                    showConfirmButton: false,
                });
            }
        }
    };

    const toBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]); // Remove the "data:image/..." prefix
            reader.onerror = (error) => reject(error);
        });
    };

    const editProduct = (product: Product | null = null) => {
        if (product) {
            setParams({ ...product });
        } else {
            setParams({
                id: null,
                name: '',
                description: '',
                sellingPrice: '',
                manufacturedPrice: '',
                code: '',
                category: '',
                stock: '',
                image: null,
                day: false, // Change from 'false' (string) to false (boolean)
                evening: false, // Change from 'false' (string) to false (boolean)
            });
        }
        setAddProductModal(true);
    };

    useEffect(() => {
        let filtered = productList;

        if (search.trim()) {
            filtered = filtered.filter((item) => item?.name?.toLowerCase().includes(search.toLowerCase().trim()));
        }

        if (selectedCategory) {
            filtered = filtered.filter((item) => item.category === selectedCategory);
        }

        setFilteredItems(filtered);
        setCurrentPage(1); // Reset to first page on filter change
    }, [search, selectedCategory, productList]);

    return (
        <div>
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-xl">Products</h2>

                <div className="flex sm:flex-row flex-col sm:items-center sm:gap-3 gap-4 w-full sm:w-auto">
                    {/* 👇 New Category Filter Dropdown */}
                    <h1 className="text-lg">filter: </h1>
                    <select className="form-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                        <option value="">All Categories</option>
                        {categoryList.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>

                    <div className="relative">
                        <input type="text" placeholder="Search by name" className="form-input py-2 ltr:pr-11 rtl:pl-11 peer" value={search} onChange={(e) => setSearch(e.target.value)} />
                        <button type="button" className="absolute ltr:right-[11px] rtl:left-[11px] top-1/2 -translate-y-1/2 peer-focus:text-primary">
                            <IconSearch className="mx-auto" />
                        </button>
                    </div>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => editProduct()}>
                    <IconPlus className="ltr:mr-2 rtl:ml-2" />
                    Add Product
                </button>
            </div>

            <div className="mt-5 panel p-0 border-0 overflow-hidden">
                <div className="table-responsive">
                    {loading ? (
                        <p className="text-center py-5">Loading...</p>
                    ) : filteredItems.length === 0 ? (
                        <p className="text-center py-5">No products available</p>
                    ) : (
                        <>
                            <table className="table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Product Name</th>
                                        <th>Description</th>
                                        <th>Selling Price</th>
                                        <th>Manufactured Price</th>
                                        <th>Profit Coefficient</th>
                                        <th>Code</th>
                                        <th>Category</th>
                                        <th>Stock</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((product) => (
                                        <tr key={product.id}>
                                            <td>{product.image && <img src={`data:image/jpeg;base64,${product.image}`} alt={product.name} className="w-16 h-16 object-cover rounded" />}</td>
                                            <td>{product.name}</td>
                                            <td>{product.description}</td>
                                            <td>{product.sellingPrice}</td>
                                            <td>{product.manufacturedPrice}</td>
                                            <td>{((parseFloat(product.sellingPrice) - parseFloat(product.manufacturedPrice)) / parseFloat(product.manufacturedPrice)).toFixed(2)}</td>

                                            <td>{product.code}</td>
                                            <td>{product.category}</td>
                                            <td>{product.stock}</td>
                                            <td>
                                                <div className="flex gap-4 items-center justify-center">
                                                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => editProduct(product)}>
                                                        <Visibility className="w-5 h-5" />
                                                    </button>
                                                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => deleteProduct(product)}>
                                                        <Delete className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* Styled Pagination Controls */}
                            <div className="flex justify-between items-center mt-4 p-4 shadow rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <button
                                        className={`px-3 py-2 text-sm font-medium border rounded-md transition ${
                                            currentPage === 1 ? 'text-gray-500 cursor-not-allowed' : 'text-white hover:bg-primary-dark'
                                        }`}
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    >
                                        Prev
                                    </button>
                                    <span className="text-gray-700 font-medium">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        className={`px-3 py-2 text-sm font-medium border rounded-md transition ${
                                            currentPage === totalPages ? 'text-gray-500 cursor-not-allowed' : 'text-white hover:bg-primary-dark'
                                        }`}
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Transition appear show={addProductModal} as={Fragment}>
                <Dialog as="div" open={addProductModal} onClose={() => setAddProductModal(false)} className="relative z-[51]">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
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
                                        onClick={() => setAddProductModal(false)}
                                        className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
                                    >
                                        <IconX />
                                    </button>
                                    <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">
                                        {params.id ? 'Edit Product' : 'Add Product'}
                                    </div>
                                    <div className="p-5">
                                        <form>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className="mb-5">
                                                    <label htmlFor="name">Product Name</label>
                                                    <input
                                                        id="name"
                                                        type="text"
                                                        placeholder="Enter Product Name"
                                                        className={`form-input ${errors.name ? 'border-red-500' : ''}`}
                                                        value={params.name}
                                                        onChange={changeValue}
                                                    />
                                                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                                </div>
                                                <div className="mb-5">
                                                    <label htmlFor="description">Description</label>
                                                    <textarea
                                                        id="description"
                                                        rows={3}
                                                        placeholder="Enter Description"
                                                        className={`form-textarea resize-none ${errors.description ? 'border-red-500' : ''}`}
                                                        value={params.description}
                                                        onChange={changeValue}
                                                    ></textarea>
                                                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                                                </div>
                                                <div className="mb-5">
                                                    <label htmlFor="sellingPrice">Selling Price</label>
                                                    <input
                                                        id="sellingPrice"
                                                        type="number"
                                                        placeholder="Enter Selling Price"
                                                        className={`form-input ${errors.sellingPrice ? 'border-red-500' : ''}`}
                                                        value={params.sellingPrice}
                                                        onChange={changeValue}
                                                    />
                                                    {errors.sellingPrice && <p className="text-red-500 text-sm mt-1">{errors.sellingPrice}</p>}
                                                </div>
                                                <div className="mb-5">
                                                    <label htmlFor="manufacturedPrice">Manufactured Price</label>
                                                    <input
                                                        id="manufacturedPrice"
                                                        type="number"
                                                        placeholder="Enter Manufactured Price"
                                                        className={`form-input ${errors.manufacturedPrice ? 'border-red-500' : ''}`}
                                                        value={params.manufacturedPrice}
                                                        onChange={changeValue}
                                                    />
                                                    {errors.manufacturedPrice && <p className="text-red-500 text-sm mt-1">{errors.manufacturedPrice}</p>}
                                                </div>
                                                <div className="mb-5">
                                                    <label htmlFor="code">Product Code</label>
                                                    <input
                                                        id="code"
                                                        type="text"
                                                        placeholder="Enter Product Code"
                                                        className={`form-input ${errors.code ? 'border-red-500' : ''}`}
                                                        value={params.code}
                                                        onChange={changeValue}
                                                    />
                                                    {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
                                                </div>
                                                <div className="mb-5">
                                                    <label htmlFor="category">Category</label>
                                                    <select
                                                        id="category"
                                                        className={`form-select ${errors.category ? 'border-red-500' : ''}`}
                                                        value={params.category}
                                                        onChange={(e) => setParams({ ...params, category: e.target.value })}
                                                    >
                                                        <option value="">Select a category</option>
                                                        {categoryList.map((category) => (
                                                            <option key={category} value={category}>
                                                                {category}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                                                </div>

                                                <div className="mb-5">
                                                    <label htmlFor="stock">Stock</label>
                                                    <input
                                                        id="stock"
                                                        type="number"
                                                        placeholder="Enter Stock Quantity"
                                                        className={`form-input ${errors.stock ? 'border-red-500' : ''}`}
                                                        value={params.stock}
                                                        onChange={changeValue}
                                                    />
                                                    {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
                                                </div>
                                                <div className="mb-5">
                                                    <label htmlFor="image">Product Image</label>
                                                    <input
                                                        id="image"
                                                        type="file"
                                                        className={`form-input ${errors.image ? 'border-red-500' : ''}`}
                                                        onChange={(e) => setParams({ ...params, image: e.target.files ? e.target.files[0] : null })}
                                                    />
                                                    {/* 👇 Show preview of existing image */}
                                                    {params.image && typeof params.image === 'string' && (
                                                        <img src={`data:image/jpeg;base64,${params.image}`} alt="Existing" className="mt-2 w-24 h-24 object-cover rounded border" />
                                                    )}
                                                    {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
                                                </div>

                                                <label>
                                                    <input id="day" type="checkbox" checked={params.day} onChange={changeValue} /> Day
                                                </label>
                                                <label>
                                                    <input id="evening" type="checkbox" checked={params.evening} onChange={changeValue} /> Evening
                                                </label>
                                            </div>
                                            <div className="flex justify-end items-center mt-8">
                                                <button type="button" className="btn btn-outline-danger" onClick={() => setAddProductModal(false)}>
                                                    Cancel
                                                </button>
                                                <button type="button" className="btn btn-primary ltr:ml-4 rtl:mr-4" onClick={saveProduct}>
                                                    {params.id ? 'Update' : 'Add'}
                                                </button>
                                            </div>
                                        </form>
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

export default Products;
