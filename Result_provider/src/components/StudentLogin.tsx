import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function StudentLogin() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  async function fetchClasses() {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Failed to load classes');
    } else {
      setClasses(data);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: student, error } = await supabase
        .from('students')
        .select('id, name')
        .eq('admission_no', admissionNo)
        .eq('class_id', selectedClass)
        .single();

      if (error || !student) {
        toast.error('Invalid admission number or class');
        return;
      }

      // Log access
      await supabase.from('access_logs').insert([
        { student_id: student.id }
      ]);

      // Store student info in session storage
      sessionStorage.setItem('studentId', student.id);
      sessionStorage.setItem('studentName', student.name);
      
      navigate('/results');
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white rounded-xl shadow-xl p-8">
        <div className="text-center">
          <GraduationCap className="mx-auto h-12 w-12 text-rose-800" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Student Results Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your class and admission number to view results
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="class" className="block text-sm font-medium text-gray-700">
                Select Class
              </label>
              <select
                id="class"
                required
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm rounded-md"
              >
                <option value="">Select your class</option>
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="admission" className="block text-sm font-medium text-gray-700">
                Admission Number (ADM NO)
              </label>
              <input
                id="admission"
                type="text"
                required
                value={admissionNo}
                onChange={(e) => setAdmissionNo(e.target.value)}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-rose-800 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50"
            >
              {loading ? (
                'Loading...'
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  View Results
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <a href="/admin" className="text-sm font-medium text-rose-800 hover:text-rose-700">
            Admin Login →
          </a>
        </div>
      </div>
    </div>
  );
}