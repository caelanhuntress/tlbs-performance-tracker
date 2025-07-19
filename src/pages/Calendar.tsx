// ...other imports
import { useEntries, Entry } from "../context/EntriesContext";

const Calendar = () => {
  // Remove: const [entries, setEntries] = useState<Entry[]>([]);
  const { entries, addEntry } = useEntries();
  // ...rest of your code, no change needed for addEntry logic
};