import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../store';
import { setPageTitle } from '../store/themeConfigSlice';
import IconMultipleForwardRight from '../components/Icon/IconMultipleForwardRight';
import RevenueChart from './RevenueCard';
import DashboardSummary from './statisticsCard';
import TopSellingProducts from './TopSelling';
import WeeklySalesChart from './WeeklySalesChart';

const Index = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Sales Admin'));
    });
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;

    const [loading] = useState(false);

    return (
        <div>
            <h1 className='text-xl'>Dashboard</h1>

            <div className="pt-5">
                <div className="grid xl:grid-cols-1 gap-6 p-3">
                    <DashboardSummary />
                </div>

                <div className="grid xl:grid-cols-2 gap-6 mb-6 p-3">
                    {/* Column 1 */}
                    <div className="panel h-full">
                        <RevenueChart isDark={isDark} isRtl={isRtl} />
                    </div>

                    {/* Column 2 */}
                    <div className="panel h-full">
                        <WeeklySalesChart isDark={false} isRtl={false}/>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Index;
