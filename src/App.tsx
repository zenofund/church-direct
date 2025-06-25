import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginForm } from './components/auth/LoginForm'
import { RegisterForm } from './components/auth/RegisterForm'
import { ResetPasswordForm } from './components/auth/ResetPasswordForm'
import { ChurchDirectory } from './components/church/ChurchDirectory'
import { AddChurchWizard } from './components/church/AddChurchWizard'
import { AdminDashboard } from './components/admin/AdminDashboard'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/reset-password" element={<ResetPasswordForm />} />
          
          {/* Protected Routes */}
          <Route path="/directory" element={
            <ProtectedRoute>
              <Layout>
                <ChurchDirectory />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/add-church" element={
            <ProtectedRoute>
              <Layout>
                <AddChurchWizard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/directory" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App