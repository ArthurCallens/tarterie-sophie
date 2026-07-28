import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { Login } from "./auth/Login";
import { ForgotPassword } from "./auth/ForgotPassword";
import { ResetPassword } from "./auth/ResetPassword";
import { RequireAuth } from "./auth/RequireAuth";
import { AdminLayout } from "./layout/AdminLayout";
import { ProductsPage } from "./products/ProductsPage";
import { ProductForm } from "./products/ProductForm";
import { CustomCakePage } from "./custom-cake/CustomCakePage";
import { AccountPage } from "./account/AccountPage";
import { OrdersPage } from "./orders/OrdersPage";
import { CalendarPage } from "./calendar/CalendarPage";
import { ArchivePage } from "./archive/ArchivePage";

export function AdminApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route
          path="*"
          element={
            <RequireAuth>
              <AdminLayout>
                <Routes>
                  <Route index element={<Navigate to="orders" replace />} />
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="archive" element={<ArchivePage />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="products/new" element={<ProductForm />} />
                  <Route path="products/:id/edit" element={<ProductForm />} />
                  <Route path="custom-cake" element={<CustomCakePage />} />
                  <Route path="account" element={<AccountPage />} />
                </Routes>
              </AdminLayout>
            </RequireAuth>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
