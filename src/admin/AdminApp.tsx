import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { Login } from "./auth/Login";
import { RequireAuth } from "./auth/RequireAuth";
import { AdminLayout } from "./layout/AdminLayout";
import { ProductsPage } from "./products/ProductsPage";
import { ProductForm } from "./products/ProductForm";
import { CustomCakePage } from "./custom-cake/CustomCakePage";

export function AdminApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route
          path="*"
          element={
            <RequireAuth>
              <AdminLayout>
                <Routes>
                  <Route index element={<Navigate to="products" replace />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="products/new" element={<ProductForm />} />
                  <Route path="products/:id/edit" element={<ProductForm />} />
                  <Route path="custom-cake" element={<CustomCakePage />} />
                </Routes>
              </AdminLayout>
            </RequireAuth>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
