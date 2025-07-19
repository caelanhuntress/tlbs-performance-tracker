import { EntriesProvider } from "./context/EntriesContext";
// ...other imports

function App() {
  return (
    <EntriesProvider>
      {/* ...your routing and pages/components */}
    </EntriesProvider>
  );
}

export default App;