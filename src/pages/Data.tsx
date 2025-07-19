// ...other imports
import { useEntries } from "../context/EntriesContext";

const Data = () => {
  // Remove: const [entries, setEntries] = useState<Entry[]>([...]);
  const { entries, updateEntry, deleteEntry } = useEntries();
  // Use updateEntry and deleteEntry instead of local functions
};