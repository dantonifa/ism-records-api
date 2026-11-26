import type { FormEventHandler } from "react";

interface SearchFilterProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  placeholder?: string;
}

export default function SearchFilter({
  query,
  onQueryChange,
  onSubmit,
  placeholder = "Search by student ID or name",
}: SearchFilterProps) {
  return (
    <form className="student-search" onSubmit={onSubmit}>
      <label htmlFor="student-search" className="visually-hidden">
        Search students
      </label>
      <input
        id="student-search"
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={placeholder}
      />
      <button type="submit">Search</button>
    </form>
  );
}
