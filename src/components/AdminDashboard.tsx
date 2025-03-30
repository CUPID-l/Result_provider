import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Search, Plus, Trash2, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchClasses();
    fetchStudents();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin');
    }
  }

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

  async function fetchStudents() {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        class:classes(name),
        results:results(
          subject:subjects(name),
          marks,
          grade
        )
      `)
      .order('admission_no');

    if (error) {
      toast.error('Failed to load students');
    } else {
      setStudents(data);
    }
  }

  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('classes')
        .insert([{ name: newClassName }]);

      if (error) {
        toast.error('Failed to create class');
        return;
      }

      toast.success('Class created successfully');
      setNewClassName('');
      fetchClasses();
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteClass(classId: string) {
    if (!confirm('Are you sure you want to delete this class? This will delete all associated student records.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);

      if (error) {
        toast.error('Failed to delete class');
        return;
      }

      toast.success('Class deleted successfully');
      fetchClasses();
      fetchStudents();
    } catch (error) {
      toast.error('An error occurred');
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Extract subject names (excluding ADM.NO, NAME, and %)
      const headers = Object.keys(jsonData[0]);
      const subjectNames = headers.filter(h => !['ADM.NO', 'NAME', '%'].includes(h));

      // Create subjects if they don't exist
      for (const subjectName of subjectNames) {
        const { error: subjectError } = await supabase
          .from('subjects')
          .upsert({ name: subjectName }, { onConflict: 'name' });

        if (subjectError) {
          throw new Error(`Failed to create subject: ${subjectName}`);
        }
      }

      // Fetch all subjects after creation
      const { data: subjects, error: fetchError } = await supabase
        .from('subjects')
        .select('*')
        .in('name', subjectNames);

      if (fetchError) {
        throw new Error('Failed to fetch subjects');
      }

      // Process each student
      for (const row of jsonData) {
        // Create or update student
        const { data: student, error: studentError } = await supabase
          .from('students')
          .upsert({
            admission_no: row['ADM.NO'],
            name: row['NAME'],
            class_id: selectedClass
          })
          .select()
          .single();

        if (studentError) {
          throw new Error(`Failed to create student: ${row['ADM.NO']}`);
        }

        // Create results for each subject
        const results = subjectNames.map(subject => {
          const marks = parseFloat(row[subject]);
          return {
            student_id: student.id,
            subject_id: subjects.find(s => s.name === subject).id,
            marks,
            grade: calculateGrade(marks)
          };
        });

        const { error: resultError } = await supabase
          .from('results')
          .upsert(results);

        if (resultError) {
          throw new Error(`Failed to create results for student: ${row['ADM.NO']}`);
        }
      }

      toast.success('Results uploaded successfully');
      fetchStudents();
    } catch (error) {
      toast.error('Failed to upload results: ' + error.message);
    } finally {
      setUploadLoading(false);
      e.target.value = '';
    }
  }

  function calculateGrade(marks: number): string {
    if (marks >= 90) return 'A1';
    if (marks >= 80) return 'A2';
    if (marks >= 70) return 'B1';
    if (marks >= 60) return 'B2';
    if (marks >= 50) return 'C1';
    if (marks >= 40) return 'C2';
    if (marks >= 30) return 'D';
    return 'E';
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/admin');
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.admission_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="flex items-center px-4 py-2 text-sm font-medium text-rose-800 bg-white rounded-md hover:bg-rose-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Class Management */}
        <div className="bg-white rounded-xl shadow-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Class Management</h2>
          <form onSubmit={handleCreateClass} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="Enter class name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 text-white bg-rose-800 rounded-md hover:bg-rose-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </button>
          </form>
          <div className="space-y-2">
            {classes.map((cls: any) => (
              <div key={cls.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <span>{cls.name}</span>
                <button
                  onClick={() => handleDeleteClass(cls.id)}
                  className="text-rose-600 hover:text-rose-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Result Upload */}
        <div className="bg-white rounded-xl shadow-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Upload Results</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500"
              >
                <option value="">Select a class</option>
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".xlsx,.xls"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploadLoading || !selectedClass}
              />
              <div className="space-y-2">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="text-sm text-gray-600">
                  {uploadLoading ? (
                    'Uploading...'
                  ) : (
                    <>
                      <span className="text-rose-800 font-medium">Click to upload</span> or drag and drop
                      <br />Excel file containing results
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-xl shadow-xl p-6">
        <div className="flex items-center mb-4">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name or admission number..."
            className="ml-2 flex-1 px-3 py-2 border-b-2 border-gray-200 focus:border-rose-500 focus:outline-none"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admission No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Results
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student: any) => (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.admission_no}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.class?.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {student.results?.map((result: any) => (
                      <div key={result.id}>
                        {result.subject.name}: {result.marks} ({result.grade})
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
// BY CUPID