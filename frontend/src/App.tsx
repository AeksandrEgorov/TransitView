// This is the small root component for the frontend.
// It keeps the route tree in one place so the app starts from a clean wrapper.

import AppRoutes from "./routes/AppRoutes";

function App() {
  return <AppRoutes />;
}

export default App;
