import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/layout/AdminSidebar';
import Topbar from '../components/layout/Topbar';

export default function AdminLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
            <AdminSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
            <div className="flex flex-col flex-1 w-full overflow-hidden">
                <Topbar toggleSidebar={toggleSidebar} />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar relative focus:outline-none">
                    {children || <Outlet />}
                </main>
            </div>
        </div>
    );
}