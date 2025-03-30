import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import StudentLogin from './components/StudentLogin';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import StudentResults from './components/StudentResults';
import { GraduationCap } from 'lucide-react';
import { Analytics } from "@vercel/analytics/react"
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-rose-900 to-rose-700">
        <nav className="bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <GraduationCap className="h-8 w-8 text-white" />
                <span className="ml-2 text-xl font-bold text-white">Student Results Portal</span>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<StudentLogin />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/results" element={<StudentResults />} />
          </Routes>
        </main>

        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;
// BY CUPID