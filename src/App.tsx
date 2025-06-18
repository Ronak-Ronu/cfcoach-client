import { Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home';
import { Signup } from './components/Auth/Signup';
import { Login } from './components/Auth/Login';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import StudentProfile from './pages/StudentProfile';
import StudentProfileByToken from './pages/StudentProfileByToken'; 
export default function App() {
  return (

    <Routes>
      <Route path="/" element={<Home />} />
      <Route element={<PublicRoute />}>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/student/token/:token" element={<StudentProfileByToken />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
		<Route path="/student/:id" element={<StudentProfile />} />
      </Route>
    </Routes>
  );
}