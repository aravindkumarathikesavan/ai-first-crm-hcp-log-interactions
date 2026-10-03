import React, { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllDoctors } from "./store/interactionsSlice";
import LogInteractionScreen from "./components/LogInteractionScreen";

/* ─── Custom Dropdown ────────────────────────────────────────
   A fully styled, accessible dropdown that replaces <select>.
   Shows label above, options list below the trigger button.
   ─────────────────────────────────────────────────────────── */
function HcpDropdown({ value, options, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const wrapperRef = useRef(null);
  const listRef = useRef(null);

  const selected = options.find((o) => o.value === value) || null;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setFocusIdx(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll focused item into view
  useEffect(() => {
    if (open && listRef.current && focusIdx >= 0) {
      const item = listRef.current.children[focusIdx];
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [focusIdx, open]);

  const handleToggle = () => {
    setOpen((prev) => !prev);
    setFocusIdx(-1);
  };

  const handleSelect = useCallback((opt) => {
    onChange(opt.value);
    setOpen(false);
    setFocusIdx(-1);
  }, [onChange]);

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
        setFocusIdx(0);
      }
      return;
    }
    if (e.key === "Escape") { setOpen(false); setFocusIdx(-1); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setFocusIdx((i) => Math.min(i + 1, options.length - 1)); return; }
    if (e.key === "ArrowUp")   { e.preventDefault(); setFocusIdx((i) => Math.max(i - 1, 0)); return; }
    if (e.key === "Enter" && focusIdx >= 0) { e.preventDefault(); handleSelect(options[focusIdx]); return; }
  };

  return (
    <div className="custom-dropdown-wrapper" ref={wrapperRef}>
      {/* Trigger button */}
      <button
        type="button"
        id="hcp-selector"
        className={`custom-dropdown-trigger${open ? " is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select Healthcare Professional"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        <span className="custom-dropdown-value">
          {selected ? selected.label : placeholder}
        </span>
        <span className="custom-dropdown-arrow" aria-hidden="true">
          {open ? "▴" : "▾"}
        </span>
      </button>

      {/* Options list */}
      {open && (
        <ul
          role="listbox"
          ref={listRef}
          className="custom-dropdown-list"
          aria-label="Healthcare Professional options"
        >
          {options.map((opt, idx) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={[
                "custom-dropdown-option",
                opt.value === value ? "is-selected" : "",
                idx === focusIdx ? "is-focused" : "",
              ].filter(Boolean).join(" ")}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(opt); }}
              onMouseEnter={() => setFocusIdx(idx)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ─── App ─────────────────────────────────────────────────── */
export default function App() {
  const dispatch = useDispatch();
  const [selectedHcp, setSelectedHcp] = useState(null);
  const doctors = useSelector((state) => state.interactions.doctors || []);

  useEffect(() => {
    dispatch(fetchAllDoctors());
  }, [dispatch]);

  const handleHcpSelected = (hcpIdOrObj) => {
    if (!hcpIdOrObj) { setSelectedHcp(null); return; }
    if (typeof hcpIdOrObj === "string") {
      const h = doctors.find((item) => item.id === hcpIdOrObj);
      setSelectedHcp(h || null);
    } else {
      setSelectedHcp(hcpIdOrObj);
    }
  };

  // Build options for the custom dropdown
  const dropdownOptions = [
    { value: "", label: "— All Interactions —" },
    ...doctors.map((h) => ({ value: h.id, label: h.name })),
  ];

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          {/* Brand */}
          <div className="brand-container">
            <div className="brand-mark">H</div>
            <div>
              <div className="brand-title">HCP CRM</div>
              <div className="brand-subtitle">AI-first field engagement</div>
            </div>
          </div>

          {/* HCP Custom Dropdown — label above, custom list below */}
          <div className="hcp-picker-block">
            <label className="hcp-picker-label" htmlFor="hcp-selector">
              Healthcare Professional
            </label>
            {doctors.length === 0 ? (
              <div className="custom-dropdown-trigger is-disabled">
                <span className="custom-dropdown-value muted">No doctors logged yet</span>
                <span className="custom-dropdown-arrow" aria-hidden="true">▾</span>
              </div>
            ) : (
              <HcpDropdown
                value={selectedHcp ? selectedHcp.id : ""}
                options={dropdownOptions}
                placeholder="— All Interactions —"
                onChange={(val) => handleHcpSelected(val || null)}
              />
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        <LogInteractionScreen hcp={selectedHcp} onHcpSelected={handleHcpSelected} />
      </main>
    </div>
  );
}
