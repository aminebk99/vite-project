import { RouterProvider } from "react-router-dom";
import { AuthProvider }   from "./AuthContext";
import { router }         from "./Router";
 
export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
} 