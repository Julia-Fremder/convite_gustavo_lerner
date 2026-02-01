import { useNavigate } from 'react-router-dom';
import { logout } from '../utils/auth';
import PaymentsPage from './PaymentsPage';
import './AdminPage.css';

const AdminPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Painel Admin</h1>
        <button onClick={handleLogout} className="logout-button">
          Sair
        </button>
      </header>
      <div className="admin-content">
        <PaymentsPage />
      </div>
    </div>
  );
};

export default AdminPage;
