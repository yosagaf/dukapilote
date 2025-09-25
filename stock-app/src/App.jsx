import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SidebarProvider } from './contexts/SidebarContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import MyShop from './pages/MyShop'
import MyDepots from './pages/MyDepots'
import Sales from './pages/Sales'
import Reports from './pages/Reports'
import QuotesInvoices from './pages/QuotesInvoices'
import AdminDashboard from './pages/AdminDashboard'
import PrivateRoute from './components/PrivateRoute'

function App() {
  return (
    <SidebarProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/inventaire" element={
              <PrivateRoute>
                <Inventory />
              </PrivateRoute>
            } />
            <Route path="/mon-magasin" element={
              <PrivateRoute>
                <MyShop />
              </PrivateRoute>
            } />
            <Route path="/mes-depots" element={
              <PrivateRoute>
                <MyDepots />
              </PrivateRoute>
            } />
            <Route path="/ventes" element={
              <PrivateRoute>
                <Sales />
              </PrivateRoute>
            } />
            <Route path="/rapports" element={
              <PrivateRoute>
                <Reports />
              </PrivateRoute>
            } />
            <Route path="/devis-factures" element={
              <PrivateRoute>
                <QuotesInvoices />
              </PrivateRoute>
            } />
            <Route path="/admin" element={
              <PrivateRoute adminOnly>
                <AdminDashboard />
              </PrivateRoute>
            } />
          </Routes>
        </div>
        </Router>
      </AuthProvider>
    </SidebarProvider>
  )
}

export default App
