import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { Student } from '@/types';
import StudentProfile from './StudentProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StudentProfileByToken = () => {
  const { token } = useParams<{ token: string }>();

  const { data: student, isLoading, error } = useQuery<Student, Error>({
    queryKey: ['studentByToken', token],
    queryFn: async () => {
      const response = await axios.get(`/students/token/${token}`);
      return response.data;
    },
  });

  if (isLoading) return <div className="text-foreground">Loading...</div>;
  if (error) return <div className="text-destructive">Error: {error.message}</div>;
  if (!student) return <div className="text-destructive">Invalid or expired profile link</div>;

  const coachName = typeof student.teacherId === 'object' 
    ? student.teacherId.name 
    : 'Your Coach';

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">
              Added by Coach: {coachName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You're viewing this profile through a shareable link
            </p>
          </CardContent>
        </Card>
        
        <StudentProfile student={student} />
      </div>
    </div>
  );
};

export default StudentProfileByToken;