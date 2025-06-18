import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/utils/ThemeToggler';

export const Home = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-4">CF Code Coach!</h1>
      <div className='absolute top-5 right-5'>
      <ThemeToggle />
      </div>

      <p className="text-lg text-muted-foreground mb-6 text-center max-w-md">
        Manage your students progress with Codeforces data integration and automated reminders.
      </p>
      <div className="space-x-4">
        <Link to="/login">
          <Button  className='h-12 w-20'>
            <b>
            Log In
            </b>
            
            </Button>
        </Link>
        <Link to="/signup">
          <Button variant="outline" className='h-12 w-20'>
            <b>

            Sign Up
            </b>
            </Button>
        </Link>
      </div>
    </div>
  );
};