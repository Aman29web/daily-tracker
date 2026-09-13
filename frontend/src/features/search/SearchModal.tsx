import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Repeat, CheckSquare, Target, BookOpen } from "lucide-react";
import Modal from "../../components/ui/Modal";
import { useUiStore } from "../../stores/uiStore";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { searchApi } from "../../api/endpoints/insights";
import "./SearchModal.css";

interface ResultItem {
  _id: string;
  name?: string;
  title?: string;
  content?: string;
}

export default function SearchModal() {
  const open = useUiStore((s) => s.searchOpen);
  const setOpen = useUiStore((s) => s.setSearchOpen);
  const [q, setQ] = useState("");
  const debounced = useDebouncedValue(q, 250);
  const navigate = useNavigate();

  const { data, isFetching } = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => searchApi.search(debounced),
    enabled: open && debounced.trim().length > 0,
  });

  const close = () => {
    setOpen(false);
    setQ("");
  };

  const groups = [
    { key: "habits", label: "Habits", icon: Repeat, to: () => "/habits" },
    { key: "tasks", label: "Tasks", icon: CheckSquare, to: () => "/tasks" },
    { key: "goals", label: "Goals", icon: Target, to: () => "/goals" },
    { key: "journal", label: "Journal", icon: BookOpen, to: () => "/journal" },
  ] as const;

  return (
    <Modal open={open} onClose={close} width={520}>
      <div className="search-modal">
        <div className="search-input-row">
          <Search size={17} />
          <input
            autoFocus
            className="search-input"
            placeholder="Search habits, tasks, goals, journal…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="search-results">
          {!debounced && <p className="search-hint">Start typing to search everything.</p>}
          {debounced && isFetching && <p className="search-hint">Searching…</p>}
          {debounced &&
            !isFetching &&
            data &&
            groups.map((g) => {
              const items = (data[g.key] as ResultItem[]) ?? [];
              if (!items.length) return null;
              return (
                <div key={g.key} className="search-group">
                  <div className="search-group-label">
                    <g.icon size={13} /> {g.label}
                  </div>
                  {items.map((item) => (
                    <button
                      key={item._id}
                      className="search-result"
                      type="button"
                      onClick={() => {
                        close();
                        navigate(g.to());
                      }}
                    >
                      {item.name ?? item.title ?? item.content?.slice(0, 60)}
                    </button>
                  ))}
                </div>
              );
            })}
          {debounced &&
            !isFetching &&
            data &&
            Object.values(data).every((arr) => (arr as unknown[]).length === 0) && (
              <p className="search-hint">No results for "{debounced}"</p>
            )}
        </div>
      </div>
    </Modal>
  );
}
