import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';

export default function StudentLayout({ children }) {
    // Manage the mobile sidebar open/close state
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
            
            {/* The Navigation Sidebar */}
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

            {/* The Main Content Area */}
            <div className="flex flex-col flex-1 w-full overflow-hidden">
                
                {/* The Top Header */}
                <Topbar toggleSidebar={toggleSidebar} />

                {/* The Scrollable Page Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar relative focus:outline-none">
                    {/* Render the specific page content here (e.g., Dashboard, Subject List, etc.) */}
                    {children || <Outlet />}
                </main>
                
            </div>
        </div>
    );
}