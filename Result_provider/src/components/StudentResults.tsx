import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function StudentResults() {
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const studentId = sessionStorage.getItem('studentId');
    if (!studentId) {
      navigate('/');
      return;
    }

    fetchResults(studentId);
  }, [navigate]);

  async function fetchResults(studentId: string) {
    try {
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          *,
          class:classes(name)
        `)
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      const { data: resultsData, error: resultsError } = await supabase
        .from('results')
        .select(`
          *,
          subject:subjects(name)
        `)
        .eq('student_id', studentId);

      if (resultsError) throw resultsError;

      setStudent(studentData);
      setResults(resultsData);
    } catch (error) {
      toast.error('Failed to load results');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  function calculateTotal() {
    return results.reduce((sum, result: any) => sum + parseFloat(result.marks), 0);
  }

  function calculatePercentage() {
    if (results.length === 0) return 0;
    return (calculateTotal() / (results.length * 100) * 100).toFixed(2);
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-8">
      <div className="flex justify-between items-start mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-rose-800 hover:text-rose-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center px-4 py-2 text-white bg-rose-800 rounded-md hover:bg-rose-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Result Card</h1>
        <p className="text-gray-600 mt-2">Academic Year 2024-25</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <p className="text-sm text-gray-600">Student Name</p>
          <p className="font-medium">{student.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Admission Number</p>
          <p className="font-medium">{student.admission_no}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Class</p>
          <p className="font-medium">{student.class.name}</p>
        </div>
      </div>

      <div className="overflow-hidden border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Marks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Grade
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((result: any) => (
              <tr key={result.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {result.subject.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {result.marks}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {result.grade}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                Total
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {calculateTotal()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {calculatePercentage()}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}