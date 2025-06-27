import PerfectScrollbar from 'react-perfect-scrollbar';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { toggleSidebar } from '../../store/themeConfigSlice';
import { IRootState } from '../../store';
import { useState, useEffect } from 'react';
import IconBox from '../Icon/IconBox';
import IconBookmark from '../Icon/IconBookmark';
import IconNotes from '../Icon/IconNotes';
import IconLogout from '../Icon/IconLogout';
import IconHome from '../Icon/IconHome';
import IconInbox from '../Icon/IconInbox';
import CompanyIcon from '../Icon/IconSettings';
import Swal from 'sweetalert2';
import { createClient } from '@supabase/supabase-js';
import IconFile2 from '../../components/Icon/IconShoppingCart';
import IconUSer from '../../components/Icon/IconUsers';
import IconFile from '../../components/Icon/IconNotes';
import IconArchive from '../Icon/IconArchive';
import IconChecks from '../Icon/IconChecks';
import IconListCheck from '../Icon/IconListCheck';

const Sidebar = () => {
    const navigate = useNavigate();
    const [currentMenu, setCurrentMenu] = useState<string>('');
    const [companyLogo, setCompanyLogo] = useState<string | null>(null);
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const location = useLocation();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const toggleMenu = (value: string) => {
        setCurrentMenu((oldValue) => {
            return oldValue === value ? '' : value;
        });
    };

    useEffect(() => {
        const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link') || [];
                if (ele.length) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele.click();
                    });
                }
            }
        }
    }, []);

    useEffect(() => {
        if (window.innerWidth < 1024 && themeConfig.sidebar) {
            dispatch(toggleSidebar());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);

    const handleLogout = () => {
        Swal.fire({
            title: t('Are you sure?'),
            text: t('You will be logged out of your session.'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: t('Yes, logout'),
            cancelButtonText: t('Cancel'),
        }).then((result) => {
            if (result.isConfirmed) {
                // Clear user session data
                localStorage.clear();
                Swal.fire(t('Logged Out'), t('You have been successfully logged out.'), 'success').then(() => { });

                navigate('/');
            }
        });
    };

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav
                className={`sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}
            >
                <div className="bg-white dark:bg-black h-full">
                    <div className="flex justify-between items-center px-4 py-3">
                        <NavLink to="/zeko_dashboard" className="main-logo flex items-center shrink-0">
                            <img className="w-14 ml-[5px] flex-none" src="/assets/images/logo.png" alt="Default Logo" />
                        </NavLink>
                    </div>
                    <PerfectScrollbar className="h-[calc(100vh-80px)] relative">
                        <ul className="relative font-semibold space-y-0.5 p-4 py-0">
                            <li className="nav-item">
                                <ul>
                                    <li className="nav-item">
                                        <NavLink to="/zeko_dashboard" className="group">
                                            <div className="flex items-center">
                                                <IconHome className="group-hover:!text-primary shrink-0" />
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Dashboard')}</span>
                                            </div>
                                        </NavLink>
                                    </li>

                                    <li className="nav-item">
                                        <NavLink to="/users" className="group">
                                            <div className="flex items-center">
                                                <IconUSer className="group-hover:!text-primary shrink-0" />
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Users')}</span>
                                            </div>
                                        </NavLink>
                                    </li>

                                     <li className="nav-item">
                                        <NavLink to="/bookings" className="group">
                                            <div className="flex items-center">
                                                <IconListCheck className="group-hover:!text-primary shrink-0" />
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Bookings')}</span>
                                            </div>
                                        </NavLink>
                                    </li>


                                    <li className="nav-item">
                                        <NavLink to="/types" className="group">
                                            <div className="flex items-center">
                                                <IconChecks className="group-hover:!text-primary shrink-0" />
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Types')}</span>
                                            </div>
                                        </NavLink>
                                    </li>

                                    <li className="nav-item">
                                        <NavLink to="/concerts" className="group">
                                            <div className="flex items-center">
                                                <IconBookmark className="group-hover:!text-primary shrink-0" />
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Concerts')}</span>
                                            </div>
                                        </NavLink>
                                    </li>

                                    <li className="nav-item">
                                        <NavLink to="/tickets" className="group">
                                            <div className="flex items-center">
                                                <IconFile className="group-hover:!text-primary shrink-0" />
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Tickets')}</span>
                                            </div>
                                        </NavLink>
                                    </li>

                                    {/* <li className="nav-item">
                                        <NavLink to="/invoice" className="group">
                                            <div className="flex items-center">
                                                <IconInbox className="group-hover:!text-primary shrink-0" />
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Invoice')}</span>
                                            </div>
                                        </NavLink>
                                    </li> */}

                                    {/* <li className="nav-item">
                                        <NavLink to="/Company" className="group">
                                            <div className="flex items-center">
                                                <CompanyIcon className="group-hover:!text-primary shrink-0" />
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Company')}</span>
                                            </div>
                                        </NavLink>
                                    </li> */}

                                    {/* <li className="nav-item">
                                        <NavLink to="/reports" className="group">
                                            <div className="flex items-center">
                                                <IconFile className="group-hover:!text-primary shrink-0" />
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Reports')}</span>
                                            </div>
                                        </NavLink>
                                    </li> */}

                                    <li className="nav-item">
                                        <NavLink
                                            to="/"
                                            className="group"
                                            onClick={(e) => {
                                                e.preventDefault(); // Prevent immediate navigation
                                                handleLogout();
                                            }}
                                        >
                                            <div className="flex items-center">
                                                <IconLogout className="group-hover:!text-primary shrink-0" />
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Logout')}</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
