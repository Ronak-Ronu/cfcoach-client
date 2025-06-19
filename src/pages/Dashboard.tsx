import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/auth';
import axios from '@/lib/axios';
import axiosPublic from 'axios'; // For public API calls to Codeforces
import { Student, StudentFormData } from '@/types';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '@/components/utils/ThemeToggler';
import { exportToCSV, exportToPDF } from '../components/utils/exportUtils';
import { useToast } from '@/components/toast-provider';


export const Dashboard = () => {
  const { logout } = useAuth();
  const { toast } = useToast()
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [serverError, setServerError] = useState<string>('');
  const [handleValidationError, setHandleValidationError] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentFormData>({
    defaultValues: { name: '', email: '', codeforcesHandle: '' },
  });

  const { data: students, isLoading, error } = useQuery<Student[], Error>({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await axios.get('/students');
      return response.data;
    },
  });

  const validateHandleMutation = useMutation<
    { status: string; result?: any; comment?: string },
    Error,
    string
  >({
    mutationFn: async (handle: string) => {
      const response = await axiosPublic.get(
        `https://codeforces.com/api/user.info?handles=${handle}`
      );
      return response.data;
    },
    onError: () => {
      // console.error('Handle validation failed:', err);
      setHandleValidationError('Failed to validate Codeforces handle');
      toast('Failed to validate Codeforces handle', 'error');
    },
  });

  const createMutation = useMutation<void, Error, StudentFormData>({
    mutationFn: (data) => axios.post('/students', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      reset();
      setServerError('');
      setHandleValidationError('');
      toast('Student Added', 'success');
    },
    onError: (err) => {
      // console.error('Create student failed:', err);
      setServerError(err.message || 'Failed to create student');
      toast('Failed to create student', 'error');
    },
  });

  const updateMutation = useMutation<void, Error, StudentFormData & { id: string }>({
    mutationFn: (data) => axios.put(`/students/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setEditingStudent(null);
      reset();
      setServerError('');
      setHandleValidationError('');
      toast('Student Updated', 'success');
    },
    onError: (err) => {
      console.error('Update student failed:', err);
      setServerError(err.message || 'Failed to update student');
      toast('Failed to update student', 'error');
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (id) => axios.delete(`/students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setServerError('');
      setHandleValidationError('');
      toast('Student Deleted', 'success');
    },
    onError: (err) => {
      console.error('Delete student failed:', err);
      setServerError(err.message || 'Failed to delete student');
      toast('Failed to delete student', 'error');
    },
  });

  const syncMutation = useMutation<void, Error, string>({
    mutationFn: (studentId) => axios.post('/sync', { studentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setServerError('');
      setHandleValidationError('');
      toast('Data Synced Successfully', 'success');
    },
    onError: (err) => {
      console.error('Sync failed:', err);
      setServerError(err.message || 'Failed to sync data');
      toast('Failed to sync data', 'error');
    },
  });

  const onSubmit = async (data: StudentFormData) => {
    setServerError('');
    setHandleValidationError('');

    try {
      const response = await validateHandleMutation.mutateAsync(data.codeforcesHandle);
      if (response.status === 'FAILED') {
        setHandleValidationError(
          response.comment || 'Invalid Codeforces handle'
        );
        return;
      }

      // Proceed with create or update
      if (editingStudent) {
        updateMutation.mutate({ ...data, id: editingStudent._id });
      } else {
        createMutation.mutate(data);
      }
    } catch (err) {
      // Error 
    }
    if (editingStudent) {
      updateMutation.mutate({ ...data, id: editingStudent._id! });
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    reset({ name: student.name, email: student.email, codeforcesHandle: student.codeforcesHandle });
    setServerError('');
    setHandleValidationError('');
  };

  const handleSync = (studentId: string) => {
    syncMutation.mutate(studentId);
  };

  const handleRowClick = (studentId: string) => {
    navigate(`/student/${studentId}`);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    }, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
  }, [queryClient]);

  if (isLoading) return <div className="text-foreground">Loading...</div>;
  if (error) return <div className="text-destructive">Error loading students: {error.message}</div>;

  return (
    <div className="min-h-screen bg-background p-8">
            <div className='absolute top-5 right-5'>
      <ThemeToggle />
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Hello Coach,</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={logout}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
            >
              Logout
            </button>
          </div>
        </div>

        {(serverError || handleValidationError) && (
          <p className="text-destructive text-center mb-4">
            {serverError || handleValidationError}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-8 bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-foreground">{editingStudent ? 'Edit Student' : 'Add Student'}</h2>
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-foreground">
              Name
            </label>
            <input
              id="name"
              type="text"
              className={`w-full px-3 py-2 border rounded-md bg-background text-foreground ${
                errors.name ? 'border-destructive' : 'border-input'
              } focus:outline-none focus:ring-2 focus:ring-primary`}
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={`w-full px-3 py-2 border rounded-md bg-background text-foreground ${
                errors.email ? 'border-destructive' : 'border-input'
              } focus:outline-none focus:ring-2 focus:ring-primary`}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
              })}
            />
            {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="codeforcesHandle" className="block text-sm font-medium text-foreground">
              Codeforces Handle
            </label>
            <input
              id="codeforcesHandle"
              type="text"
              className={`w-full px-3 py-2 border rounded-md bg-background text-foreground ${
                errors.codeforcesHandle || handleValidationError ? 'border-destructive' : 'border-input'
              } focus:outline-none focus:ring-2 focus:ring-primary`}
              {...register('codeforcesHandle', { required: 'Codeforces Handle is required' })}
              disabled={validateHandleMutation.isPending}
            />
            {errors.codeforcesHandle && <p className="text-destructive text-sm">{errors.codeforcesHandle.message}</p>}
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={validateHandleMutation.isPending}
            >
              {validateHandleMutation.isPending ? 'Validating...' : editingStudent ? 'Update' : 'Add'}
            </button>
            {editingStudent && (
              <button
                type="button"
                onClick={() => {
                  setEditingStudent(null);
                  reset();
                  setServerError('');
                  setHandleValidationError('');
                }}
                className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/90"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="bg-card rounded-lg shadow-md overflow-x-auto">
        <div className="flex gap-3 mb-4">
          <button
            onClick={async () => {
              if (!students || students.length === 0) return;
              try {
                await exportToCSV(students);
              } catch (error) {
                console.error('CSV export failed:', error);
                // Add your error handling UI here
              }
            }}
            disabled={!students || students.length === 0}
            className="inline-flex items-center px-4 py-2.5 rounded-lg transition-all duration-200 ease-in-out
              bg-indigo-100 text-indigo-700 border border-indigo-200 hover:bg-indigo-200 hover:border-indigo-300
              dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-800 dark:hover:bg-indigo-900/50
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none
              font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15" />
            </svg>
            Export CSV
          </button>
          
          <button
            onClick={async () => {
              if (!students || students.length === 0) return;
              try {
                await exportToPDF(students);
              } catch (error) {
                console.error('PDF export failed:', error);
              }
            }}
            disabled={!students || students.length === 0}
            className="inline-flex items-center px-4 py-2.5 rounded-lg transition-all duration-200 ease-in-out
              bg-teal-100 text-teal-700 border border-teal-200 hover:bg-teal-200 hover:border-teal-300
              dark:bg-teal-900/30 dark:text-teal-200 dark:border-teal-800 dark:hover:bg-teal-900/50
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none 
              font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            Export PDF
          </button>
        </div>

          <table className="w-full text-left text-foreground border-blue-700">
            <thead className="bg-muted">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Codeforces Handle</th>
                <th className="p-4">Submissions</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students?.map((student) => (
                <tr
                  key={student._id}
                  className="border-t border-muted cursor-pointer hover:bg-blue-900 hover:bg-opacity-20"
                  onClick={() => handleRowClick(student._id)}
                >
                  <td className="p-4">{student.name}</td>
                  <td className="p-4">{student.email}</td>
                  <td className="p-4">{student.codeforcesHandle}</td>
                  <td className="p-4">{student.submissions?.length || 0}</td>
                  <td className="p-4 space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEdit(student)}
                      className="px-2 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(student._id)}
                      className="px-2 py-1 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleSync(student._id)}
                      className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
                    >
                      Sync
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};