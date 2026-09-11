import React, { useState, useMemo, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard, ClipboardList, ChevronDown, Settings, Inbox,
  Archive, CheckCircle2, XCircle, Clock, Plus, User,
  FileText, FolderOpen, CheckSquare, Users as UsersIcon,
  ArrowUpDown, ArrowUp, ArrowDown, Eye, ChevronLeft, X,
  SlidersHorizontal
} from "lucide-react";

const teal = "#3F7D6B";
const amber = "#C77D2E";
const brick = "#A33F35";
const ink = "#171B19";
const navBg = "#4B4B5A";
const navBgDark = "#42424F";
const pageBg = "#E9EAF0";
const border = "#E1E1E8";
const muted = "#8B8B94";
const viewGreen = "#2FA36B";
const linkBlue = "#2563EB";
const purple = "#4B2E83";
const lavender = "#DCC7F2";
const lavenderInk = "#2E1A47";
const skyBadge = "#3FA9D6";

const seedRequests = [];

const pageTitles = {
  dashboard: "Dashboard",
  request: "Request",
  "request-form": "Request",
  "request-detail": "Request Details",
  answered: "Answered",
  archives: "Archives",
  approval: "Approval",
  "approval-detail": "Request Details",
  "umi-sprout": "SPROUT",
  "umi-inhouse": "INHOUSE",
  "umi-instafin": "INSTAFIN",
  logs: "Logs",
  "department-list": "Department List",
  "password-config": "Password Configuration",
  instafin: "INSTAFIN",
  ecpay: "ECPay",
  gcash: "GCash",
  pesonet: "PesoNet",
  "user-access": "User Access",
};

const CATEGORY_TYPES = {
  SOFTWARE: ["WINDOWS UPDATE", "ANTIVIRUS INSTALLATION", "MS OFFICE INSTALLATION", "SYSTEM APPLICATION INSTALLATION"],
  USER: ["NEW USER ACCOUNT", "USER ACCESS RIGHTS UPDATE", "PASSWORD RESET", "ACCOUNT DEACTIVATION"],
  CONNECTIVITY: ["LAN SETUP", "WI-FI ACCESS CONFIGURATION", "VPN ACCESS SETUP", "INTERNET LINE INSTALLATION"],
  HARDWARE: ["DESKTOP INSTALLATION", "PRINTER INSTALLATION", "NETWORK SWITCH INSTALLATION", "MONITOR INSTALLATION"],
};
const HOW_TEXT = "RECOMMENDING APPROVAL OF IT OPERATIONS UNIT HEAD.";
const APPROVAL_CHAIN = ["PRESIDENT & CEO", "ITSD HEAD", "IT OPERATIONS UNIT HEAD", "DEPARTMENT HEAD"];
const EMPLOYEES = ["Dina Liggayu", "Garry Escarpe", "Maricel Fontanilla", "Jerome Bautista", "Katrina Salazar", "President & CEO", "ITSD Head", "Department Head"];
const IT_OPS_EMPLOYEES = ["Carlo Dizon", "Ivy Ramos", "Neil Aguilar", "Renz Alonzo", "Patricia Reyes"];
const BRANCHES = [
  "Head Office",
  "Poblacion Branch",
  "San Fernando Branch",
  "Batangas Branch",
  "Lipa Branch",
  "Calamba Branch",
  "Los Baños Branch",
  "Sto. Tomas Branch",
  "Tanauan Branch",
  "Lucena Branch",
];

function formatWhenLong(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }).toUpperCase();
}

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDateTime(dateStr, timeStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${MONTH_ABBR[m - 1]} ${d}, ${y}${timeStr ? " " + timeStr : ""}`;
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function requestCoversDate(r, dateStr) {
  if (r.installFrom && r.installTo) return dateStr >= r.installFrom && dateStr <= r.installTo;
  return r.dateNeeded === dateStr;
}

function buildCalendarGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) {
    const day = daysInPrevMonth - startWeekday + 1 + i;
    cells.push({ day, inMonth: false, dateStr: null });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ day, inMonth: true, dateStr });
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const day = cells.length - (startWeekday + daysInMonth) + 1;
    cells.push({ day, inMonth: false, dateStr: null });
    if (cells.length >= 42) break;
  }
  return cells;
}

function StatusPill({ status }) {
  const map = {
    pending: { bg: "#FAEEDA", fg: "#854F0B", label: "Pending" },
    answered: { bg: "#E1F5EE", fg: "#085041", label: "Answered" },
    archived: { bg: "#F1EFE8", fg: "#444441", label: "Archived" },
  };
  const s = map[status];
  return (
    <span style={{ background: s.bg, color: s.fg, fontSize: 12, padding: "3px 10px", borderRadius: 999, fontWeight: 500 }}>
      {s.label}
    </span>
  );
}

function DecisionPill({ decision }) {
  const isApproved = decision === "APPROVED";
  return (
    <span style={{
      background: isApproved ? "#E1F5EE" : "#FBE4E1",
      color: isApproved ? "#085041" : "#8C2C22",
      fontSize: 11.5, fontWeight: 700, padding: "4px 11px", borderRadius: 4,
      letterSpacing: 0.2, display: "inline-block",
    }}>
      {isApproved ? "Approved" : "Disapproved"}
    </span>
  );
}

function RequestStatusPill({ request }) {
  const map = {
    "Pending Approval": { bg: "#DDEEFF", fg: "#1E5FA8" },
    "In Progress": { bg: "#FDEBD3", fg: "#8A5A0F" },
    "Done": { bg: "#E1F5EE", fg: "#085041" },
    "Disapproved": { bg: "#FBE4E1", fg: "#8C2C22" },
    "Archived": { bg: "#F1EFE8", fg: "#444441" },
  };
  const label = getRequestStageLabel(request);
  const s = map[label];
  return (
    <span style={{ background: s.bg, color: s.fg, fontSize: 12, padding: "3px 10px", borderRadius: 999, fontWeight: 600 }}>
      {label}
    </span>
  );
}

function getRequestStageLabel(request) {
  if (request.status === "archived") return "Archived";
  if (request.status === "pending") return "Pending Approval";
  if (request.status === "answered") {
    if (request.decision === "DISAPPROVED") return "Disapproved";
    if (request.decision === "APPROVED") return request.completed ? "Done" : "In Progress";
  }
  return "Pending Approval";
}

function getPreviewStatusLabel(request) {
  if (request.status === "archived") return "Archived";
  if (request.status === "answered" && request.decision === "APPROVED") return "Approved";
  if (request.status === "answered" && request.decision === "DISAPPROVED") return "Disapproved";
  return "In Progress";
}

function PreviewStatusPill({ request }) {
  const map = {
    "In Progress": { bg: "#FDEBD3", fg: "#8A5A0F" },
    "Approved": { bg: "#E1F5EE", fg: "#085041" },
    "Disapproved": { bg: "#FBE4E1", fg: "#8C2C22" },
    "Archived": { bg: "#F1EFE8", fg: "#444441" },
  };
  const label = getPreviewStatusLabel(request);
  const s = map[label];
  return (
    <span style={{ background: s.bg, color: s.fg, fontSize: 12, padding: "3px 10px", borderRadius: 999, fontWeight: 600 }}>
      {label}
    </span>
  );
}

function PriorityTag({ priority }) {
  const map = { High: brick, Medium: amber, Low: "#5F5E5A" };
  return (
    <span style={{ color: map[priority], fontSize: 12.5, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: map[priority], display: "inline-block" }} />
      {priority}
    </span>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 6, padding: "18px 20px", boxShadow: "0 1px 3px rgba(30,30,45,0.08)", ...style }}>
      {children}
    </div>
  );
}

function Table({ rows, columns, empty }) {
  if (!rows.length) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: muted, fontSize: 14 }}>
        {empty}
      </div>
    );
  }
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} style={{ textAlign: "left", padding: "10px 12px", borderBottom: `1px solid ${border}`, color: muted, fontWeight: 500, fontSize: 12 }}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            {columns.map((c) => (
              <td key={c.key} style={{ padding: "12px", borderBottom: `1px solid ${border}`, color: ink }}>
                {c.render ? c.render(r) : r[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function InitialsCircle({ name }) {
  const initials = name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#FFFFFF", border: `1.5px solid ${purple}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: purple, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function WeekEventTile({ request, onClick }) {
  const names = (request.assignedTo || "").split(",").map((n) => n.trim()).filter(Boolean);
  const branch = request.for || request.where || request.location || "—";
  return (
    <div
      onClick={onClick}
      title={`${branch} — ${request.assignedTo || ""}`}
      style={{ cursor: "pointer", background: lavender, borderRadius: 10, padding: "10px 10px 8px 10px", display: "flex", flexDirection: "column", gap: 8, minHeight: 96 }}
    >
      <div style={{ display: "flex" }}>
        {names.map((n, i) => (
          <div key={n} style={{ marginLeft: i === 0 ? 0 : -6 }}>
            <InitialsCircle name={n} />
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: lavenderInk, lineHeight: 1.3, flex: 1 }}>{branch}</div>
      <div style={{ fontSize: 9.5, color: "#6A4E85" }}>{request.id}</div>
    </div>
  );
}

function MonthEventChip({ request, onClick }) {
  const names = (request.assignedTo || "").split(",").map((n) => n.trim()).filter(Boolean);
  const branch = request.for || request.where || request.location || "—";
  return (
    <div
      onClick={onClick}
      title={`${branch} — ${request.assignedTo || ""} — ${request.id}`}
      style={{ cursor: "pointer", background: lavender, borderRadius: 4, marginTop: 4, padding: "2px 5px", display: "flex", alignItems: "center", gap: 4, overflow: "hidden" }}
    >
      {names[0] && (
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#FFFFFF", border: `1px solid ${purple}`, fontSize: 6, fontWeight: 700, color: purple, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {names[0].trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
        </span>
      )}
      <span style={{ fontSize: 10, fontWeight: 600, color: lavenderInk, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{branch}</span>
    </div>
  );
}

// ---- Shared DataTable card: Show entries / Search / sortable headers / pagination ----
// This follows the layout from the Employee Portal's TICRO Approval / Answered screens.
function ViewButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ background: viewGreen, color: "#fff", border: "none", borderRadius: 4, padding: "6px 16px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = 0.88)}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = 1)}
    >
      View
    </button>
  );
}

function ModifyButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ background: teal, color: "#fff", border: "none", borderRadius: 4, padding: "6px 16px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = 0.88)}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = 1)}
    >
      Modify
    </button>
  );
}

function DataListCard({ title, rows, columns, emptyText }) {
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: null, dir: "asc" });

  const searchableKeys = useMemo(() => columns.filter((c) => c.key).map((c) => c.key), [columns]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => searchableKeys.map((k) => String(r[k] ?? "")).join(" ").toLowerCase().includes(q));
  }, [rows, search, searchableKeys]);

  const sorted = useMemo(() => {
    if (!sort.key) return filtered;
    const { key, dir } = sort;
    return [...filtered].sort((a, b) => {
      const av = String(a[key] ?? "");
      const bv = String(b[key] ?? "");
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const start = sorted.length === 0 ? 0 : (pageClamped - 1) * pageSize + 1;
  const end = Math.min(pageClamped * pageSize, sorted.length);
  const pageRows = sorted.slice((pageClamped - 1) * pageSize, pageClamped * pageSize);

  const toggleSort = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
    setPage(1);
  };

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "18px 20px", borderBottom: `1px solid ${border}`, fontSize: 15, fontWeight: 600, color: "#1F2937" }}>
        {title}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: ink }}>
          Show
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            style={{ padding: "5px 8px", borderRadius: 6, border: `1px solid ${border}`, fontSize: 13.5, background: "#FCFCFD", color: ink }}
          >
            {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          entries
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: ink }}>
          Search:
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${border}`, fontSize: 13.5, background: "#FCFCFD", color: ink, width: 200 }}
          />
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr>
              {columns.map((col) => {
                const isSortable = col.sortable !== false && !!col.key;
                return (
                  <th
                    key={col.label}
                    onClick={isSortable ? () => toggleSort(col.key) : undefined}
                    style={{ textAlign: "left", padding: "10px 12px", borderBottom: `1px solid ${border}`, color: muted, fontWeight: 500, fontSize: 12, cursor: isSortable ? "pointer" : "default", whiteSpace: "nowrap" }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {col.label}
                      {isSortable && (sort.key === col.key ? (sort.dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} color="#C6C6CE" />)}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} style={{ padding: "40px 20px", textAlign: "center", color: muted, fontSize: 14 }}>
                  {emptyText}
                </td>
              </tr>
            )}
            {pageRows.map((r) => (
              <tr key={r.id}>
                {columns.map((col) => {
                  const value = col.render ? col.render(r) : r[col.key];
                  const cellStyle = {
                    padding: "12px", borderBottom: `1px solid ${border}`, color: ink,
                    ...(col.uppercase ? { textTransform: "uppercase", letterSpacing: 0.2 } : {}),
                    ...(col.truncate ? { maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } : {}),
                  };
                  return (
                    <td key={col.label} style={cellStyle} title={col.truncate ? String(r[col.key] ?? "") : undefined}>
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", flexWrap: "wrap", gap: 10 }}>
        <span style={{ fontSize: 13, color: muted }}>
          Showing {start} to {end} of {sorted.length} entries
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pageClamped <= 1}
            style={{ border: `1px solid ${border}`, background: "#FFFFFF", borderRadius: 6, padding: "6px 14px", fontSize: 13, cursor: pageClamped <= 1 ? "default" : "pointer", color: pageClamped <= 1 ? "#C6C6CE" : ink }}
          >
            Previous
          </button>
          <span style={{ background: linkBlue, color: "#fff", borderRadius: 6, padding: "6px 13px", fontSize: 13, fontWeight: 600 }}>
            {pageClamped}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={pageClamped >= totalPages}
            style={{ border: `1px solid ${border}`, background: "#FFFFFF", borderRadius: 6, padding: "6px 14px", fontSize: 13, cursor: pageClamped >= totalPages ? "default" : "pointer", color: pageClamped >= totalPages ? "#C6C6CE" : ink }}
          >
            Next
          </button>
        </div>
      </div>
    </Card>
  );
}

function DetailModal({ entry, onClose, onApprove, onReject }) {
  if (!entry) return null;
  const { request: r, mode } = entry;
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(23,27,25,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 10, width: "100%", maxWidth: 540, boxShadow: "0 24px 64px rgba(20,20,35,0.28)", overflow: "hidden" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${border}` }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: ink }}>{r.id}</div>
            <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>Request details</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: muted, padding: 4, display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div>
          <MemoRow label="Type">{r.equipment}</MemoRow>
          <MemoRow label="Category">{r.department}</MemoRow>
          <MemoRow label="What">{r.what}</MemoRow>
          <MemoRow label="Who">{r.requester}</MemoRow>
          <MemoRow label="Where">{r.location}</MemoRow>
          <MemoRow label="Request date">{formatDateTime(r.submitted, r.submittedTime)}</MemoRow>
          <MemoRow label="Needed by" last={!r.decision}>{r.dateNeeded}</MemoRow>
          {r.decision && (
            <MemoRow label="Status" last>
              <DecisionPill decision={r.decision} />
            </MemoRow>
          )}
        </div>

        {mode === "approval" && (
          <div style={{ display: "flex", gap: 10, padding: "16px 20px", borderTop: `1px solid ${border}`, justifyContent: "flex-end" }}>
            <button
              onClick={onReject}
              style={{ background: "#FBE4E1", color: "#8C2C22", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <XCircle size={15} /> Disapprove
            </button>
            <button
              onClick={onApprove}
              style={{ background: teal, color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <CheckCircle2 size={15} /> Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function NavItem({ label, icon: Icon, hasMenu, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 7, background: active ? "rgba(255,255,255,0.10)" : "transparent",
        border: "none", color: "#EDEDF2", padding: "13px 16px", fontSize: 14.5, fontWeight: 500, cursor: "pointer",
      }}
    >
      {Icon && <Icon size={16} strokeWidth={2} />}
      {label}
      {hasMenu && <ChevronDown size={14} strokeWidth={2} />}
    </button>
  );
}

function DropdownMenu({ children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return (
    <div ref={ref} style={{ position: "absolute", top: "100%", left: 0, background: "#FFFFFF", boxShadow: "0 8px 24px rgba(20,20,35,0.18)", borderRadius: 6, padding: 14, zIndex: 20, minWidth: 260 }}>
      {children}
    </div>
  );
}

function MenuColumn({ title, icon: Icon, items, onPick }) {
  return (
    <div style={{ minWidth: 150 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: muted, fontSize: 11.5, fontWeight: 500, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {Icon && <Icon size={13} />} {title}
      </div>
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onPick(it.id)}
          style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", border: "none", padding: "7px 8px", borderRadius: 5, fontSize: 13.5, color: ink, cursor: "pointer" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F1F5")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function PlainMenuList({ items, onPick }) {
  return (
    <div style={{ minWidth: 160 }}>
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onPick(it.id)}
          style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", background: "transparent", border: "none", padding: "8px 4px", borderRadius: 5, fontSize: 14, color: "#2B3A55", cursor: "pointer" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F1F5")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <span style={{ color: muted }}>–</span> {it.label}
        </button>
      ))}
    </div>
  );
}

function SettingsColumn({ title, items, onPick }) {
  return (
    <div style={{ minWidth: 190 }}>
      <div style={{ fontSize: 15.5, fontWeight: 500, color: "#2B3A55", marginBottom: 12 }}>
        {title}
      </div>
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onPick(it.id)}
          style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", background: "transparent", border: "none", padding: "7px 4px", borderRadius: 5, fontSize: 14, color: "#2B3A55", cursor: "pointer" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F1F5")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <span style={{ color: muted }}>–</span> {it.label}
        </button>
      ))}
    </div>
  );
}

function UserAccessColumn({ onClick }) {
  return (
    <div style={{ minWidth: 150 }}>
      <div style={{ fontSize: 15.5, fontWeight: 500, color: "#2B3A55", marginBottom: 12 }}>
        User Access
      </div>
      <button
        onClick={onClick}
        style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", background: "transparent", border: "none", padding: "7px 4px", borderRadius: 5, fontSize: 14, color: "#2B3A55", cursor: "pointer" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F1F5")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <span style={{ color: muted }}>–</span> Modify
      </button>
    </div>
  );
}

function Crumb({ items }) {
  return (
    <div style={{ fontSize: 13, color: muted, marginBottom: 14, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color: "#C6C6CE" }}>/</span>}
          <span style={{ color: i === items.length - 1 ? muted : "#3A3A44" }}>{it}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

export default function OpsConsole() {
  const [selected, setSelected] = useState("dashboard");
  const [openMenu, setOpenMenu] = useState(null);
  const [requests, setRequests] = useState(seedRequests);
  const [toast, setToast] = useState(null);
  const [modalEntry, setModalEntry] = useState(null);
  const [viewingRequestId, setViewingRequestId] = useState(null);
  const [viewSource, setViewSource] = useState("request");
  const [decisionForm, setDecisionForm] = useState({ decision: "", remarks: "", to: "", assignTo: "", installFrom: "", installTo: "" });
  const [decisionFormError, setDecisionFormError] = useState("");
  const [form, setForm] = useState({ category: "", type: [], what: "", for: "", who: "", why: "", where: "", when: "", how: HOW_TEXT, approvalOf: "" });
  const [formError, setFormError] = useState("");
  const [listSearch, setListSearch] = useState("");
  const [listPageSize, setListPageSize] = useState(10);
  const [listPage, setListPage] = useState(1);
  const [listSort, setListSort] = useState({ key: "submitted", dir: "desc" });
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(8);
  const [viewDay, setViewDay] = useState(3);
  const [calendarMode, setCalendarMode] = useState("month");
  const [calendarFilterOpen, setCalendarFilterOpen] = useState(false);
  const today = { year: 2026, month: 8, day: 3 };
  const calendarCells = useMemo(() => buildCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const selectedDate = useMemo(() => new Date(viewYear, viewMonth, viewDay), [viewYear, viewMonth, viewDay]);
  const weekDates = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [selectedDate]);
  const goPrevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); } else setViewMonth((m) => m - 1); };
  const goNextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); } else setViewMonth((m) => m + 1); };
  const setViewDate = (d) => { setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); setViewDay(d.getDate()); };
  const goPrev = () => {
    if (calendarMode === "month") return goPrevMonth();
    if (calendarMode === "week") return setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - 7));
    return setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - 1));
  };
  const goNext = () => {
    if (calendarMode === "month") return goNextMonth();
    if (calendarMode === "week") return setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 7));
    return setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1));
  };
  const goToday = () => { setViewYear(today.year); setViewMonth(today.month); setViewDay(today.day); };
  const upcoming = useMemo(() => [...requests].filter((r) => r.status !== "archived").sort((a, b) => (a.dateNeeded > b.dateNeeded ? 1 : -1)).slice(0, 6), [requests]);

  const pending = useMemo(() => requests.filter((r) => r.status === "pending"), [requests]);
  const answered = useMemo(() => requests.filter((r) => r.status === "answered"), [requests]);
  const archived = useMemo(() => requests.filter((r) => r.status === "archived"), [requests]);
  const categoryCounts = useMemo(() => {
    const counts = { SOFTWARE: 0, USER: 0, CONNECTIVITY: 0, HARDWARE: 0 };
    requests.forEach((r) => {
      const cat = r.category || r.department;
      if (counts[cat] !== undefined) counts[cat] += 1;
    });
    return counts;
  }, [requests]);
  const viewingRequest = useMemo(() => requests.find((r) => r.id === viewingRequestId) || null, [requests, viewingRequestId]);

  const listRows = useMemo(() => {
    const withDisplay = requests.map((r) => ({
      ...r,
      displayType: r.type || r.equipment || "—",
      displayCategory: r.category || r.department || "—",
      displayWhat: r.what || r.notes || "—",
      displayHolder: r.requester || "—",
    }));
    const q = listSearch.trim().toLowerCase();
    const filtered = q
      ? withDisplay.filter((r) =>
          [r.id, r.displayType, r.displayCategory, r.displayWhat, r.displayHolder, r.status]
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      : withDisplay;
    const { key, dir } = listSort;
    const sorted = [...filtered].sort((a, b) => {
      const av = key === "type" ? a.displayType : key === "category" ? a.displayCategory : key === "what" ? a.displayWhat : key === "holder" ? a.displayHolder : a[key];
      const bv = key === "type" ? b.displayType : key === "category" ? b.displayCategory : key === "what" ? b.displayWhat : key === "holder" ? b.displayHolder : b[key];
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [requests, listSearch, listSort]);

  const listTotalPages = Math.max(1, Math.ceil(listRows.length / listPageSize));
  const listPageClamped = Math.min(listPage, listTotalPages);
  const listStart = listRows.length === 0 ? 0 : (listPageClamped - 1) * listPageSize + 1;
  const listEnd = Math.min(listPageClamped * listPageSize, listRows.length);
  const listPageRows = listRows.slice((listPageClamped - 1) * listPageSize, listPageClamped * listPageSize);

  const toggleListSort = (key) => {
    setListSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  };

  const openModal = (request, mode) => setModalEntry({ request, mode });
  const closeModal = () => setModalEntry(null);

  const decide = (id, decision) => {
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status: "answered", decision, assignedTo: r.assignedTo || "IT Operations Team" } : r)));
    setToast(decision === "APPROVED" ? "Request approved" : "Request disapproved");
    closeModal();
    setTimeout(() => setToast(null), 2200);
  };

  const openApprovalDetail = (r) => {
    setViewingRequestId(r.id);
    setDecisionForm({ decision: "", remarks: "", to: "", assignTo: "", installFrom: "", installTo: "" });
    setDecisionFormError("");
    setSelected("approval-detail");
  };

  const openRequestDetail = (r, source) => {
    setViewingRequestId(r.id);
    setViewSource(source);
    setSelected("request-detail");
  };

  const submitApprovalDecision = () => {
    if (!decisionForm.decision || !decisionForm.remarks.trim()) {
      setDecisionFormError("Decision and remarks are required.");
      return;
    }
    if (decisionForm.decision === "FORWARD" && !decisionForm.to) {
      setDecisionFormError("Select who to forward this request to.");
      return;
    }
    if (decisionForm.decision === "APPROVE" && !decisionForm.assignTo) {
      setDecisionFormError("Select an IT Operations personnel to assign this request to.");
      return;
    }
    if (decisionForm.decision === "APPROVE" && (!decisionForm.installFrom || !decisionForm.installTo)) {
      setDecisionFormError("Select the Installation Date range (From and To).");
      return;
    }
    if (decisionForm.decision === "APPROVE" && decisionForm.installTo < decisionForm.installFrom) {
      setDecisionFormError("The Installation Date 'To' cannot be earlier than 'From'.");
      return;
    }
    setDecisionFormError("");
    const now = new Date();
    const approvedDate = now.toISOString().slice(0, 10);
    const approvedTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setRequests((rs) => rs.map((r) => {
      if (r.id !== viewingRequestId) return r;
      if (decisionForm.decision === "APPROVE") return { ...r, status: "answered", decision: "APPROVED", assignedTo: decisionForm.assignTo, approvedDate, approvedTime, installFrom: decisionForm.installFrom, installTo: decisionForm.installTo };
      if (decisionForm.decision === "DISAPPROVE") return { ...r, status: "answered", decision: "DISAPPROVED" };
      if (decisionForm.decision === "FORWARD") return { ...r, forwardedTo: decisionForm.to, lastRemark: decisionForm.remarks };
      if (decisionForm.decision === "SEND_BACK") return { ...r, sentBack: true, lastRemark: decisionForm.remarks };
      return r;
    }));
    const toastMsg = {
      APPROVE: "Request approved",
      DISAPPROVE: "Request disapproved",
      FORWARD: `Request forwarded to ${decisionForm.to}`,
      SEND_BACK: "Request sent back to requestor",
    }[decisionForm.decision];
    setToast(toastMsg);
    setTimeout(() => setToast(null), 2200);
    setSelected("approval");
  };

  const handleWhatChange = (value) => {
    setForm((f) => ({ ...f, what: value }));
  };

  const submitRequest = () => {
    if (!form.category || form.type.length === 0 || !form.for || !form.who || !form.why || !form.where || !form.when || !form.how || !form.approvalOf) {
      setFormError("Fill in every field before submitting.");
      return;
    }
    setFormError("");
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const id = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const newReq = {
      id,
      category: form.category,
      type: form.type.join(", "),
      what: form.what,
      for: form.for,
      who: form.who,
      why: form.why,
      where: form.where,
      when: form.when,
      how: form.how,
      approvalChain: [form.approvalOf],
      requester: form.who,
      department: form.category,
      equipment: form.type.join(", "),
      location: form.where,
      priority: "Medium",
      dateNeeded: form.when,
      notes: form.why,
      status: "pending",
      submitted: now.toISOString().slice(0, 10),
      submittedTime: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };
    setRequests((rs) => [newReq, ...rs]);
    setForm({ category: "", type: [], what: "", for: "", who: "", why: "", where: "", when: "", how: HOW_TEXT, approvalOf: "" });
    setToast("Request submitted");
    setSelected("approval");
    setTimeout(() => setToast(null), 2200);
  };

  const goTo = (id) => { setSelected(id); setOpenMenu(null); };

  return (
    <div style={{ minHeight: "100vh", background: pageBg, fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui", color: ink }}>
      <div style={{ background: navBg }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #7FB89A, " + teal + " 70%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ClipboardList size={18} color="#F2F0E9" strokeWidth={2} />
            </div>
            <span style={{ fontSize: 19, fontWeight: 600, color: "#F5F4F0" }}>IT Installation Management</span>
          </div>
          <button style={{ width: 34, height: 34, borderRadius: "50%", background: "#5A5A69", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <User size={17} color="#EDEDF2" />
          </button>
        </div>

        <div style={{ display: "flex", position: "relative" }}>
          <div style={{ position: "relative" }}>
            <NavItem label="Dashboard" icon={LayoutDashboard} active={selected === "dashboard"} onClick={() => goTo("dashboard")} />
          </div>

          <div style={{ position: "relative" }}>
            <NavItem label="UMI" icon={User} hasMenu active={["umi-sprout", "umi-inhouse", "umi-instafin"].includes(selected)} onClick={() => setOpenMenu(openMenu === "umi" ? null : "umi")} />
            {openMenu === "umi" && (
              <DropdownMenu onClose={() => setOpenMenu(null)}>
                <PlainMenuList
                  items={[
                    { id: "umi-sprout", label: "SPROUT" },
                    { id: "umi-inhouse", label: "INHOUSE" },
                    { id: "umi-instafin", label: "INSTAFIN" },
                  ]}
                  onPick={goTo}
                />
              </DropdownMenu>
            )}
          </div>

          <div style={{ position: "relative" }}>
            <NavItem label="OPS" icon={ClipboardList} hasMenu active={["request", "request-form", "request-detail", "answered", "archives", "approval", "approval-detail"].includes(selected)} onClick={() => setOpenMenu(openMenu === "ops" ? null : "ops")} />
            {openMenu === "ops" && (
              <DropdownMenu onClose={() => setOpenMenu(null)}>
                <div style={{ color: muted, fontSize: 11.5, fontWeight: 500, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.4 }}>IT Installation</div>
                <div style={{ display: "flex", gap: 22 }}>
                  <MenuColumn title="Forms" icon={FileText} items={[{ id: "request", label: "Request" }]} onPick={goTo} />
                  <MenuColumn title="Records" icon={FolderOpen} items={[{ id: "answered", label: "Answered" }, { id: "archives", label: "Archives" }]} onPick={goTo} />
                  <MenuColumn title="Actions" icon={CheckSquare} items={[{ id: "approval", label: "Approval" }]} onPick={goTo} />
                </div>
              </DropdownMenu>
            )}
          </div>

          <div style={{ position: "relative" }}>
            <NavItem label="Settings" icon={Settings} hasMenu active={["logs", "department-list", "password-config", "instafin", "ecpay", "gcash", "pesonet", "user-access"].includes(selected)} onClick={() => setOpenMenu(openMenu === "settings" ? null : "settings")} />
            {openMenu === "settings" && (
              <DropdownMenu onClose={() => setOpenMenu(null)}>
                <div style={{ display: "flex", gap: 44 }}>
                  <SettingsColumn
                    title="System"
                    items={[
                      { id: "logs", label: "Logs" },
                      { id: "department-list", label: "Department List" },
                      { id: "password-config", label: "Password Configuration" },
                    ]}
                    onPick={goTo}
                  />
                  <SettingsColumn
                    title="3rd Party Access"
                    items={[
                      { id: "instafin", label: "INSTAFIN" },
                      { id: "ecpay", label: "ECPay" },
                      { id: "gcash", label: "GCash" },
                      { id: "pesonet", label: "PesoNet" },
                    ]}
                    onPick={goTo}
                  />
                  <UserAccessColumn onClick={() => goTo("user-access")} />
                </div>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: "26px 28px", maxWidth: 1180, margin: "0 auto" }}>
        {!["dashboard", "request", "request-form", "request-detail", "approval", "approval-detail", "answered"].includes(selected) && (
          <h1 style={{ fontSize: 26, fontWeight: 400, color: "#6B6B76", margin: "0 0 18px 0" }}>{pageTitles[selected]}</h1>
        )}

        {selected === "dashboard" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 22 }}>
              <div style={{ background: "#FFFFFF", border: `1px solid ${border}`, borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 30 }}>
                      <span style={{ fontSize: 12, color: muted, letterSpacing: 0.2 }}>Total requests</span>
                      <Inbox size={15} color={teal} />
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 600, marginTop: 10 }}>{requests.length}</div>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7, paddingTop: 2, minWidth: 180 }}>
                    {Object.entries(categoryCounts).map(([cat, count]) => {
                      const max = Math.max(1, ...Object.values(categoryCounts));
                      return (
                        <div key={cat} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 76, fontSize: 11, color: muted, flexShrink: 0 }}>
                            {cat.charAt(0) + cat.slice(1).toLowerCase()}
                          </span>
                          <div style={{ flex: 1, background: "#F1F1F5", borderRadius: 4, height: 10, overflow: "hidden" }}>
                            <div style={{ width: `${(count / max) * 100}%`, background: teal, height: "100%", borderRadius: 4, transition: "width 0.3s ease" }} />
                          </div>
                          <span style={{ width: 18, fontSize: 11.5, fontWeight: 600, color: ink, textAlign: "right", flexShrink: 0 }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div style={{ background: "#FFFFFF", border: `1px solid ${border}`, borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: muted, letterSpacing: 0.2 }}>Pending approval</span>
                  <Clock size={15} color={teal} />
                </div>
                <div style={{ fontSize: 28, fontWeight: 600, marginTop: 10 }}>{pending.length}</div>
              </div>
            </div>

            <div style={{ fontSize: 13, color: "#3A3A44" }}>
              <span>Dashboard</span>
              <span style={{ color: "#C6C6CE", margin: "0 6px" }}>/</span>
              <span style={{ color: muted }}>Calendar</span>
            </div>
            <div style={{ height: 14 }} />

            <div style={{ display: "grid", gridTemplateColumns: "2.3fr 1fr", gap: 18, alignItems: "start" }}>
              <div style={{ background: "#FFFFFF", border: `1px solid ${border}`, borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={goPrev} style={{ width: 30, height: 30, border: "none", background: "transparent", cursor: "pointer", color: "#3A3A44", fontSize: 16, borderRadius: 6 }}>‹</button>
                    <button onClick={goNext} style={{ width: 30, height: 30, border: "none", background: "transparent", cursor: "pointer", color: "#3A3A44", fontSize: 16, borderRadius: 6 }}>›</button>
                  </div>
                  <h2 style={{ fontSize: 21, fontWeight: 700, margin: 0, color: ink }}>
                    {calendarMode === "month" && `${MONTH_NAMES[viewMonth]} ${viewYear}`}
                    {calendarMode === "week" && `${MONTH_ABBR[weekDates[0].getMonth()]} ${weekDates[0].getDate()} – ${MONTH_ABBR[weekDates[6].getMonth()]} ${weekDates[6].getDate()}, ${weekDates[6].getFullYear()}`}
                    {calendarMode === "day" && `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`}
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={goToday} style={{ border: `1px solid ${border}`, background: "#FFFFFF", borderRadius: 999, padding: "7px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", color: ink }}>Today</button>
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() => setCalendarFilterOpen((o) => !o)}
                        style={{ border: `1px solid ${border}`, background: "#FFFFFF", borderRadius: 999, padding: "7px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer", color: ink, display: "inline-flex", alignItems: "center", gap: 6 }}
                      >
                        <SlidersHorizontal size={13} /> {calendarMode === "month" ? "Monthly" : calendarMode === "week" ? "Weekly" : "Daily"} <ChevronDown size={13} />
                      </button>
                      {calendarFilterOpen && (
                        <DropdownMenu onClose={() => setCalendarFilterOpen(false)}>
                          <div style={{ minWidth: 130 }}>
                            {[{ id: "day", label: "Daily" }, { id: "week", label: "Weekly" }, { id: "month", label: "Monthly" }].map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => { setCalendarMode(opt.id); setCalendarFilterOpen(false); }}
                                style={{ display: "block", width: "100%", textAlign: "left", background: calendarMode === opt.id ? "#F1F1F5" : "transparent", border: "none", padding: "8px 10px", borderRadius: 5, fontSize: 13.5, color: ink, cursor: "pointer" }}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>

                {calendarMode === "month" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
                      {WEEKDAYS.map((d) => (
                        <div key={d} style={{ fontSize: 11, color: muted, textAlign: "center", fontWeight: 500, padding: "6px 0", letterSpacing: 0.4 }}>{d}</div>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", border: `1px solid ${border}`, borderRadius: 6, overflow: "hidden" }}>
                      {calendarCells.map((cell, idx) => {
                        const col = idx % 7;
                        const isWeekend = col === 0 || col === 6;
                        const isToday = cell.inMonth && viewYear === today.year && viewMonth === today.month && cell.day === today.day;
                        const events = cell.dateStr ? requests.filter((r) => requestCoversDate(r, cell.dateStr) && r.status === "answered" && r.decision === "APPROVED" && r.assignedTo) : [];
                        return (
                          <div key={idx} style={{ minHeight: 78, padding: 8, borderRight: col < 6 ? `1px solid ${border}` : "none", borderBottom: `1px solid ${border}`, background: isWeekend ? "#F6F6F9" : "#FFFFFF" }}>
                            {isToday ? (
                              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", background: teal, color: "#fff", fontSize: 12.5, fontWeight: 600 }}>{cell.day}</span>
                            ) : (
                              <span style={{ fontSize: 12.5, color: cell.inMonth ? ink : "#C6C6CE", fontWeight: 400 }}>{cell.day}</span>
                            )}
                            {events.map((e) => (
                              <MonthEventChip key={e.id} request={e} onClick={() => openRequestDetail(e, "dashboard")} />
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {calendarMode === "week" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", border: `1px solid ${border}`, borderRadius: 6, overflow: "hidden" }}>
                    {weekDates.map((d, col) => {
                      const dateStr = toDateStr(d);
                      const isWeekend = col === 0 || col === 6;
                      const isToday = dateStr === toDateStr(new Date(today.year, today.month, today.day));
                      const events = requests.filter((r) => requestCoversDate(r, dateStr) && r.status === "answered" && r.decision === "APPROVED" && r.assignedTo);
                      return (
                        <div key={dateStr} style={{ minHeight: 220, padding: 8, borderRight: col < 6 ? `1px solid ${border}` : "none", background: isWeekend ? "#F6F6F9" : "#FFFFFF" }}>
                          <div style={{ fontSize: 10.5, color: muted, fontWeight: 500, marginBottom: 4 }}>{WEEKDAYS[col]}</div>
                          {isToday ? (
                            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", background: teal, color: "#fff", fontSize: 12.5, fontWeight: 600 }}>{d.getDate()}</span>
                          ) : (
                            <span style={{ fontSize: 12.5, color: ink, fontWeight: 400 }}>{d.getDate()}</span>
                          )}
                          <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
                            {events.map((e) => (
                              <WeekEventTile key={e.id} request={e} onClick={() => openRequestDetail(e, "dashboard")} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {calendarMode === "day" && (
                  <div style={{ border: `1px solid ${border}`, borderRadius: 6, minHeight: 260, padding: 14 }}>
                    {(() => {
                      const dateStr = toDateStr(selectedDate);
                      const events = requests.filter((r) => requestCoversDate(r, dateStr) && r.status === "answered" && r.decision === "APPROVED" && r.assignedTo);
                      if (events.length === 0) {
                        return <div style={{ padding: "30px 0", textAlign: "center", color: muted, fontSize: 13.5 }}>Nothing scheduled for this day.</div>;
                      }
                      return (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                          {events.map((e) => (
                            <WeekEventTile key={e.id} request={e} onClick={() => openRequestDetail(e, "dashboard")} />
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div style={{ background: "#FFFFFF", border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "16px 18px", borderBottom: `1px solid ${border}` }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.5, color: ink }}>INSTALLATION OVERVIEW</span>
                </div>
                <div style={{ padding: "6px 10px" }}>
                  {upcoming.length === 0 && (
                    <div style={{ padding: "20px 10px", color: muted, fontSize: 13, textAlign: "center" }}>Nothing scheduled.</div>
                  )}
                  {upcoming.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => (r.status === "pending" ? openApprovalDetail(r) : openRequestDetail(r, "dashboard"))}
                      style={{ padding: "10px 8px", borderBottom: `1px solid ${border}`, cursor: "pointer", borderRadius: 6 }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F6F6F9")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: ink }}>{r.equipment}</span>
                      </div>
                      <div style={{ fontSize: 12, color: muted, marginTop: 3 }}>{r.dateNeeded} · {r.requester}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {selected === "request" && (
          <div>
            <Crumb items={["Forms", "IT Installation", "Request"]} />

            <Card style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: `1px solid ${border}` }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: ink }}>IT Installation Request</span>
                <button
                  onClick={() => setSelected("request-form")}
                  style={{ background: teal, color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13.5, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <Plus size={15} /> Create
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: ink }}>
                  Show
                  <select
                    value={listPageSize}
                    onChange={(e) => { setListPageSize(Number(e.target.value)); setListPage(1); }}
                    style={{ padding: "5px 8px", borderRadius: 6, border: `1px solid ${border}`, fontSize: 13.5, background: "#FCFCFD", color: ink }}
                  >
                    {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  entries
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: ink }}>
                  Search:
                  <input
                    value={listSearch}
                    onChange={(e) => { setListSearch(e.target.value); setListPage(1); }}
                    style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${border}`, fontSize: 13.5, background: "#FCFCFD", color: ink, width: 200 }}
                  />
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                  <thead>
                    <tr>
                      {[
                        { key: null, label: "Action" },
                        { key: "id", label: "Request no" },
                        { key: "type", label: "Type" },
                        { key: "category", label: "Category" },
                        { key: "what", label: "What" },
                        { key: "submitted", label: "Request date" },
                        { key: "approvedDate", label: "Approval date" },
                        { key: "status", label: "Status" },
                      ].map((col) => (
                        <th
                          key={col.label}
                          onClick={col.key ? () => toggleListSort(col.key) : undefined}
                          style={{ textAlign: "left", padding: "10px 12px", borderBottom: `1px solid ${border}`, color: muted, fontWeight: 500, fontSize: 12, cursor: col.key ? "pointer" : "default", whiteSpace: "nowrap" }}
                        >
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            {col.label}
                            {col.key && (listSort.key === col.key ? (listSort.dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} color="#C6C6CE" />)}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {listPageRows.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ padding: "40px 20px", textAlign: "center", color: muted, fontSize: 14 }}>No data available in table</td>
                      </tr>
                    )}
                    {listPageRows.map((r) => (
                      <tr key={r.id}>
                        <td style={{ padding: "12px", borderBottom: `1px solid ${border}` }}>
                          <ViewButton onClick={() => openRequestDetail(r, "request")} />
                        </td>
                        <td style={{ padding: "12px", borderBottom: `1px solid ${border}`, color: ink, fontWeight: 500 }}>{r.id}</td>
                        <td style={{ padding: "12px", borderBottom: `1px solid ${border}`, color: ink }}>{r.displayType}</td>
                        <td style={{ padding: "12px", borderBottom: `1px solid ${border}`, color: ink }}>{r.displayCategory}</td>
                        <td style={{ padding: "12px", borderBottom: `1px solid ${border}`, color: ink, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.displayWhat}>{r.displayWhat}</td>
                        <td style={{ padding: "12px", borderBottom: `1px solid ${border}`, color: ink }}>{r.submitted}</td>
                        <td style={{ padding: "12px", borderBottom: `1px solid ${border}`, color: ink }}>{r.approvedDate ? formatDateTime(r.approvedDate, r.approvedTime) : "—"}</td>
                        <td style={{ padding: "12px", borderBottom: `1px solid ${border}` }}><PreviewStatusPill request={r} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px" }}>
                <span style={{ fontSize: 13, color: muted }}>
                  Showing {listStart} to {listEnd} of {listRows.length} entries
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setListPage((p) => Math.max(1, p - 1))}
                    disabled={listPageClamped <= 1}
                    style={{ border: `1px solid ${border}`, background: "#FFFFFF", borderRadius: 6, padding: "6px 14px", fontSize: 13, cursor: listPageClamped <= 1 ? "default" : "pointer", color: listPageClamped <= 1 ? "#C6C6CE" : ink }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setListPage((p) => Math.min(listTotalPages, p + 1))}
                    disabled={listPageClamped >= listTotalPages}
                    style={{ border: `1px solid ${border}`, background: "#FFFFFF", borderRadius: 6, padding: "6px 14px", fontSize: 13, cursor: listPageClamped >= listTotalPages ? "default" : "pointer", color: listPageClamped >= listTotalPages ? "#C6C6CE" : ink }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {selected === "request-form" && (
          <div style={{ maxWidth: 760 }}>
            <div style={{ fontSize: 13, color: muted, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={() => setSelected("request")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#3A3A44", display: "inline-flex", alignItems: "center", gap: 3, padding: 0, fontSize: 13 }}>
                <ChevronLeft size={13} /> Forms
              </button>
              <span style={{ color: "#C6C6CE" }}>/</span>
              <span style={{ color: "#3A3A44" }}>IT Installation</span>
              <span style={{ color: "#C6C6CE" }}>/</span>
              <span onClick={() => setSelected("request")} style={{ color: "#3A3A44", cursor: "pointer" }}>Request</span>
              <span style={{ color: "#C6C6CE" }}>/</span>
              <span style={{ color: muted }}>New request</span>
            </div>
            <p style={{ color: muted, fontSize: 13.5, margin: "-2px 0 18px 0" }}>Submitted requests appear in Actions → Approval for review.</p>
            <Card>
              <div style={{ fontSize: 15, fontWeight: 600, color: ink, marginBottom: 20 }}>Request form</div>

              <RequestField label="Category" required>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value, type: [] })}
                  style={requestBoxStyle}
                >
                  <option value="">Choose one:</option>
                  {Object.keys(CATEGORY_TYPES).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </RequestField>

              <RequestField label="Type" required hint="Select one or more assets">
                <MultiSelectDropdown
                  options={CATEGORY_TYPES[form.category] || []}
                  selected={form.type}
                  onChange={(vals) => setForm({ ...form, type: vals })}
                  disabled={!form.category}
                  placeholder={form.category ? "Choose one or more:" : "Select a category first"}
                />
              </RequestField>

              <RequestField label="What" required hint="Detailed information about the request">
                <textarea
                  value={form.what}
                  onChange={(e) => handleWhatChange(e.target.value)}
                  placeholder="e.g. REQUEST FOR INSTALLATION OF [IT ASSET] AT [BRANCH] BRANCH."
                  rows={3}
                  style={{ ...requestBoxStyle, ...requestAreaStyle }}
                />
              </RequestField>

              <RequestField label="For" required hint="Branch this request is for">
                <select
                  value={form.for}
                  onChange={(e) => setForm({ ...form, for: e.target.value })}
                  style={requestBoxStyle}
                >
                  <option value="">Choose a branch:</option>
                  {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </RequestField>

              <RequestField label="Who" required hint="Parties involved">
                <textarea
                  value={form.who}
                  onChange={(e) => setForm({ ...form, who: e.target.value })}
                  placeholder="Personnel name, position, department"
                  rows={3}
                  style={{ ...requestBoxStyle, ...requestAreaStyle }}
                />
              </RequestField>

              <RequestField label="Why" required hint="Justification">
                <textarea
                  value={form.why}
                  onChange={(e) => setForm({ ...form, why: e.target.value })}
                  placeholder="e.g. new personnel, branch opening, etc."
                  rows={3}
                  style={{ ...requestBoxStyle, ...requestAreaStyle }}
                />
              </RequestField>

              <RequestField label="Where" required hint="Specify place">
                <textarea
                  value={form.where}
                  onChange={(e) => setForm({ ...form, where: e.target.value })}
                  placeholder="Branch name / location"
                  rows={3}
                  style={{ ...requestBoxStyle, ...requestAreaStyle }}
                />
              </RequestField>

              <RequestField label="When" required hint="Specify date">
                <div>
                  <input
                    type="date"
                    value={form.when}
                    onChange={(e) => setForm({ ...form, when: e.target.value })}
                    style={requestBoxStyle}
                  />
                  {form.when && <div style={{ fontSize: 12, color: muted, marginTop: 6 }}>{formatWhenLong(form.when)}</div>}
                </div>
              </RequestField>

              <RequestField label="How" required hint="Standing recommendation on file">
                <textarea
                  value={form.how}
                  onChange={(e) => setForm({ ...form, how: e.target.value })}
                  rows={2}
                  style={{ ...requestBoxStyle, ...requestAreaStyle }}
                />
              </RequestField>

              <div style={{ marginTop: 8, paddingTop: 20, borderTop: `1px solid ${border}` }}>
                <RequestField label="Recommendation or Approval of" required>
                  <select
                    value={form.approvalOf}
                    onChange={(e) => setForm({ ...form, approvalOf: e.target.value })}
                    style={requestBoxStyle}
                  >
                    <option value="">Choose one:</option>
                    {APPROVAL_CHAIN.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                </RequestField>
              </div>

              {formError && <div style={{ color: brick, fontSize: 12.5, marginTop: 14 }}>{formError}</div>}
              <button onClick={submitRequest} style={{ marginTop: 16, background: teal, color: "#fff", border: "none", borderRadius: 6, padding: "9px 18px", fontSize: 13.5, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Plus size={15} /> Submit request
              </button>
            </Card>
          </div>
        )}

        {selected === "request-detail" && viewingRequest && (
          <div>
            <div style={{ fontSize: 13, color: muted, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={() => setSelected(viewSource === "answered" ? "answered" : viewSource === "dashboard" ? "dashboard" : "request")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#3A3A44", display: "inline-flex", alignItems: "center", gap: 3, padding: 0, fontSize: 13 }}>
                <ChevronLeft size={13} /> {viewSource === "answered" ? "Answered" : viewSource === "dashboard" ? "Dashboard" : "Request"}
              </button>
              <span style={{ color: "#C6C6CE" }}>/</span>
              <span style={{ color: muted }}>Request Details</span>
            </div>
            <RequestDetailsPanel request={viewingRequest} />
          </div>
        )}

        {selected === "approval" && (
          <div>
            <Crumb items={["Forms", "IT Installation", "Approval"]} />
            <DataListCard
              title="IT Installation Approval"
              rows={pending}
              emptyText="Queue is clear. Nothing pending."
              columns={[
                { key: null, label: "Action", sortable: false, render: (r) => <ViewButton onClick={() => openApprovalDetail(r)} /> },
                { key: "id", label: "Request No" },
                { key: "equipment", label: "Type", uppercase: true },
                { key: "department", label: "Category", uppercase: true },
                { key: "what", label: "What", uppercase: true, truncate: true },
                { key: "submitted", label: "Request Date", render: (r) => formatDateTime(r.submitted, r.submittedTime) },
                { key: "requester", label: "Requestor Name", uppercase: true },
              ]}
            />
          </div>
        )}

        {selected === "approval-detail" && viewingRequest && (
          <div>
            <div style={{ fontSize: 13, color: muted, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={() => setSelected("approval")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#3A3A44", display: "inline-flex", alignItems: "center", gap: 3, padding: 0, fontSize: 13 }}>
                <ChevronLeft size={13} /> Approval
              </button>
              <span style={{ color: "#C6C6CE" }}>/</span>
              <span style={{ color: muted }}>Request Details</span>
            </div>

            <RequestDetailsPanel request={viewingRequest} />

            <div style={{ fontSize: 16, fontWeight: 700, color: ink, margin: "22px 0 12px 2px" }}>Decision</div>
            <Card style={{ padding: 0 }}>
              <div style={{ padding: "18px 20px" }}>
                <RequestField label="Decision" required>
                  <select
                    value={decisionForm.decision}
                    onChange={(e) => setDecisionForm({ ...decisionForm, decision: e.target.value, to: "", assignTo: "" })}
                    style={requestBoxStyle}
                  >
                    <option value="">Choose One:</option>
                    <option value="SEND_BACK">Send back to requestor</option>
                    <option value="FORWARD">Forward</option>
                    <option value="APPROVE">Approve</option>
                    <option value="DISAPPROVE">Disapprove</option>
                  </select>
                </RequestField>

                {decisionForm.decision === "FORWARD" && (
                  <RequestField label="To" required hint="Forward this request to">
                    <select
                      value={decisionForm.to}
                      onChange={(e) => setDecisionForm({ ...decisionForm, to: e.target.value })}
                      style={requestBoxStyle}
                    >
                      <option value="">Choose one:</option>
                      {EMPLOYEES.map((emp) => <option key={emp} value={emp}>{emp}</option>)}
                    </select>
                  </RequestField>
                )}

                {decisionForm.decision === "APPROVE" && (
                  <>
                  <RequestField label="Assign To" required hint="IT Operations personnel to carry out this request">
                    <select
                      value={decisionForm.assignTo}
                      onChange={(e) => setDecisionForm({ ...decisionForm, assignTo: e.target.value })}
                      style={requestBoxStyle}
                    >
                      <option value="">Choose one:</option>
                      {IT_OPS_EMPLOYEES.map((emp) => <option key={emp} value={emp}>{emp}</option>)}
                    </select>
                  </RequestField>

                  <RequestField label="Installation Date" required hint="This sets the schedule shown on the Calendar">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: muted, marginBottom: 3 }}>From</div>
                        <input
                          type="date"
                          value={decisionForm.installFrom}
                          onChange={(e) => setDecisionForm({ ...decisionForm, installFrom: e.target.value, installTo: decisionForm.installTo && decisionForm.installTo < e.target.value ? e.target.value : decisionForm.installTo })}
                          style={requestBoxStyle}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: muted, marginBottom: 3 }}>To</div>
                        <input
                          type="date"
                          value={decisionForm.installTo}
                          min={decisionForm.installFrom || undefined}
                          onChange={(e) => setDecisionForm({ ...decisionForm, installTo: e.target.value })}
                          style={requestBoxStyle}
                        />
                      </div>
                    </div>
                  </RequestField>
                  </>
                )}

                <RequestField label="Remarks" required>
                  <textarea
                    value={decisionForm.remarks}
                    onChange={(e) => setDecisionForm({ ...decisionForm, remarks: e.target.value })}
                    rows={3}
                    style={{ ...requestBoxStyle, ...requestAreaStyle }}
                  />
                </RequestField>

                <RequestField label="Supporting Documents (if needed)">
                  <input type="file" style={{ fontSize: 13 }} />
                </RequestField>

                {decisionFormError && <div style={{ color: brick, fontSize: 12.5, marginBottom: 12 }}>{decisionFormError}</div>}

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={submitApprovalDecision}
                    style={{ background: purple, color: "#fff", border: "none", borderRadius: 6, padding: "10px 20px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
                  >
                    Submit Decision
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {selected === "answered" && (
          <div>
            <Crumb items={["Forms", "IT Installation", "Answered"]} />
            <DataListCard
              title="IT Installation Answered"
              rows={answered}
              emptyText="No answered requests yet."
              columns={[
                { key: null, label: "Action", sortable: false, render: (r) => <ViewButton onClick={() => openRequestDetail(r, "answered")} /> },
                { key: "id", label: "Request No" },
                { key: "department", label: "Category", uppercase: true },
                { key: "equipment", label: "Type", uppercase: true },
                { key: "submitted", label: "Request Date", render: (r) => formatDateTime(r.submitted, r.submittedTime) },
                { key: "requester", label: "Requestor Name", uppercase: true },
                { key: "assignedTo", label: "Assigned Ops Personnel", render: (r) => r.assignedTo || "Unassigned" },
                { key: "decision", label: "Status", render: (r) => <DecisionPill decision={r.decision} /> },
              ]}
            />
          </div>
        )}

        {selected === "archives" && (
          <div>
            <p style={{ color: muted, fontSize: 13.5, margin: "-10px 0 18px 0" }}>Closed, rejected, or superseded requests.</p>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <Table
                rows={archived}
                empty="Archive is empty."
                columns={[
                  { key: "id", label: "ID" },
                  { key: "requester", label: "Requester" },
                  { key: "department", label: "Department" },
                  { key: "equipment", label: "Equipment" },
                  { key: "submitted", label: "Submitted" },
                  { key: "status", label: "Status", render: (r) => <StatusPill status={r.status} /> },
                ]}
              />
            </Card>
          </div>
        )}

        {["umi-sprout", "umi-inhouse", "umi-instafin"].includes(selected) && (
          <div style={{ maxWidth: 520 }}>
            <Crumb items={["UMI", pageTitles[selected]]} />
            <p style={{ color: muted, fontSize: 13.5, margin: "-10px 0 18px 0" }}>User access details for {pageTitles[selected]}.</p>
            <Card>
              {[
                { label: "Status", value: "Active" },
                { label: "Assigned users", value: "12" },
                { label: "Last synced", value: "2026-09-09 08:45 AM" },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${border}`, fontSize: 13.5 }}>
                  <span style={{ color: muted }}>{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {selected === "logs" && (
          <div>
            <Crumb items={["Settings", "System", "Logs"]} />
            <p style={{ color: muted, fontSize: 13.5, margin: "-10px 0 18px 0" }}>Recent system activity for this console.</p>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <Table
                rows={[
                  { id: "l1", timestamp: "2026-09-09 09:02 AM", user: "U. Mercado", action: "Disapproved 20260220-133229", ip: "10.0.4.12" },
                  { id: "l2", timestamp: "2026-09-08 04:41 PM", user: "R. Alonzo", action: "Updated department list", ip: "10.0.4.18" },
                  { id: "l3", timestamp: "2026-09-08 11:15 AM", user: "P. Santos", action: "Reset password for J. Dela Cruz", ip: "10.0.4.09" },
                  { id: "l4", timestamp: "2026-09-07 02:20 PM", user: "System", action: "Synced GCash 3rd-party access", ip: "—" },
                ]}
                empty="No log entries yet."
                columns={[
                  { key: "timestamp", label: "Timestamp" },
                  { key: "user", label: "User" },
                  { key: "action", label: "Action" },
                  { key: "ip", label: "IP Address" },
                ]}
              />
            </Card>
          </div>
        )}

        {selected === "department-list" && (
          <div>
            <Crumb items={["Settings", "System", "Department List"]} />
            <p style={{ color: muted, fontSize: 13.5, margin: "-10px 0 18px 0" }}>Departments recognized by this console.</p>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <Table
                rows={[
                  { id: "d1", department: "Finance", head: "M. Ibarra", status: "Active" },
                  { id: "d2", department: "Legal", head: "D. Santos", status: "Active" },
                  { id: "d3", department: "Marketing", head: "G. Uy", status: "Active" },
                  { id: "d4", department: "Ops", head: "R. Cruz", status: "Active" },
                  { id: "d5", department: "HR", head: "B. Fernandez", status: "Active" },
                  { id: "d6", department: "IT", head: "N. Villareal", status: "Active" },
                ]}
                empty="No departments yet."
                columns={[
                  { key: "department", label: "Department" },
                  { key: "head", label: "Department Head" },
                  { key: "status", label: "Status" },
                ]}
              />
            </Card>
          </div>
        )}

        {selected === "password-config" && (
          <div style={{ maxWidth: 520 }}>
            <Crumb items={["Settings", "System", "Password Configuration"]} />
            <p style={{ color: muted, fontSize: 13.5, margin: "-10px 0 18px 0" }}>Password rules enforced across the workspace.</p>
            <Card>
              {[
                { label: "Minimum length", value: "8 characters" },
                { label: "Require special character", value: "Yes" },
                { label: "Require number", value: "Yes" },
                { label: "Password expiry", value: "90 days" },
                { label: "Multi-factor authentication", value: "Enabled" },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${border}`, fontSize: 13.5 }}>
                  <span style={{ color: muted }}>{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {["instafin", "ecpay", "gcash", "pesonet"].includes(selected) && (
          <div style={{ maxWidth: 520 }}>
            <Crumb items={["Settings", "3rd Party Access", pageTitles[selected]]} />
            <p style={{ color: muted, fontSize: 13.5, margin: "-10px 0 18px 0" }}>Connection details for {pageTitles[selected]}.</p>
            <Card>
              {[
                { label: "Status", value: "Connected" },
                { label: "API key", value: "•••• configured" },
                { label: "Last synced", value: "2026-09-09 08:45 AM" },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${border}`, fontSize: 13.5 }}>
                  <span style={{ color: muted }}>{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {selected === "user-access" && (
          <div>
            <Crumb items={["Settings", "User Access"]} />
            <p style={{ color: muted, fontSize: 13.5, margin: "-10px 0 18px 0" }}>People with access to this console.</p>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <Table
                rows={[
                  { id: "u1", name: "J. Dela Cruz", role: "Ops coordinator", scope: "Full access" },
                  { id: "u2", name: "R. Alonzo", role: "IT technician", scope: "Records only" },
                  { id: "u3", name: "P. Santos", role: "Approver", scope: "Actions only" },
                ]}
                empty="No users yet."
                columns={[
                  { key: null, label: "Action", render: (r) => <ModifyButton onClick={() => { setToast(`Modifying access for ${r.name}`); setTimeout(() => setToast(null), 1800); }} /> },
                  { key: "name", label: "Name" },
                  { key: "role", label: "Role" },
                  { key: "scope", label: "Access scope" },
                ]}
              />
            </Card>
          </div>
        )}
      </div>

      <DetailModal
        entry={modalEntry}
        onClose={closeModal}
        onApprove={() => modalEntry && decide(modalEntry.request.id, "APPROVED")}
        onReject={() => modalEntry && decide(modalEntry.request.id, "DISAPPROVED")}
      />

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 28, background: ink, color: "#F2F0E9", padding: "10px 16px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={15} color={teal} /> {toast}
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: "#8B8B94", display: "block", marginBottom: 5 }}>
        {label}
        {hint && <span style={{ color: "#B4B4BC", fontWeight: 400 }}> — {hint}</span>}
      </label>
      {children}
    </div>
  );
}

function MultiSelectDropdown({ options, selected, onChange, disabled, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (opt) => {
    if (selected.includes(opt)) onChange(selected.filter((o) => o !== opt));
    else onChange([...selected, opt]);
  };

  const summary = selected.length === 0 ? placeholder : selected.length === 1 ? selected[0] : `${selected.length} selected`;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        style={{
          ...requestBoxStyle,
          opacity: disabled ? 0.55 : 1,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: disabled ? "not-allowed" : "pointer", color: selected.length ? ink : muted,
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{summary}</span>
        <ChevronDown size={15} style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>

      {open && !disabled && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#FFFFFF", border: `1px solid ${border}`, boxShadow: "0 8px 24px rgba(20,20,35,0.14)", borderRadius: 6, zIndex: 20, maxHeight: 220, overflowY: "auto" }}>
          {options.length === 0 ? (
            <div style={{ padding: "10px 12px", fontSize: 13, color: muted }}>No options</div>
          ) : (
            options.map((opt) => (
              <label
                key={opt}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", fontSize: 13.5, color: ink, cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F6F6F9")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                  style={{ accentColor: teal, width: 14, height: 14 }}
                />
                {opt}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function RequestField({ label, required, hint, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 24, alignItems: "start", marginBottom: 22 }}>
      <div>
        <div style={{ fontSize: 13.5, color: "#1F3A5F", fontWeight: 500 }}>
          {label}
          {required && <span style={{ color: "#A33F35" }}> *</span>}
        </div>
        {hint && <div style={{ fontSize: 12, color: "#8B8B94", marginTop: 3 }}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function RequestDetailsPanel({ request }) {
  return (
    <Card>
      <div style={{ fontSize: 15, fontWeight: 700, color: ink, marginBottom: 6 }}>Request Details</div>
      <DetailRow label="Request No">{request.id}</DetailRow>
      <DetailRow label="Category">{request.category || request.department || "—"}</DetailRow>
      <DetailRow label="Type">{request.type || request.equipment || "—"}</DetailRow>
      <DetailRow label="What" hint="Detailed information about the request">{request.what || "—"}</DetailRow>
      <DetailRow label="For" hint="Branch this request is for">{request.for || "—"}</DetailRow>
      <DetailRow label="Who" hint="Parties involved">{request.who || request.requester || "—"}</DetailRow>
      <DetailRow label="Why" hint="Justification">{request.why || request.notes || "—"}</DetailRow>
      <DetailRow label="Where" hint="Specify place">{request.where || request.location || "—"}</DetailRow>
      <DetailRow label="When" hint="Specify date">{request.when || request.dateNeeded || "—"}</DetailRow>
      <DetailRow label="How" hint="Recommendation for the implementation of this request">{request.how || HOW_TEXT}</DetailRow>
      <DetailRow label="Recommendation or Approval of">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(request.approvalChain || APPROVAL_CHAIN).map((role) => (
            <span key={role} style={{ fontSize: 12, fontWeight: 500, color: "#3A3A44", background: "#F1F1F5", border: `1px solid ${border}`, borderRadius: 999, padding: "5px 12px" }}>
              {role}
            </span>
          ))}
        </div>
      </DetailRow>
      <DetailRow label="Supporting Documents (if needed)">Not Available</DetailRow>
      <DetailRow label="Requestor">{request.requester || request.who || "—"}</DetailRow>
      <DetailRow label="Requested Date">{formatDateTime(request.submitted, request.submittedTime)}</DetailRow>
      <DetailRow label="Approval Date">{request.approvedDate ? formatDateTime(request.approvedDate, request.approvedTime) : "—"}</DetailRow>
      {request.assignedTo && <DetailRow label="Assigned To">{request.assignedTo}</DetailRow>}
      {request.installFrom && request.installTo && (
        <DetailRow label="Installation Date" hint="Basis for the Calendar schedule">
          {formatDateTime(request.installFrom)} – {formatDateTime(request.installTo)}
        </DetailRow>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24, padding: "14px 0" }}>
        <div style={{ fontSize: 13.5, color: "#3A3A44" }}>Status</div>
        <div><RequestStatusPill request={request} /></div>
      </div>
    </Card>
  );
}

function DetailRow({ label, hint, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24, padding: "14px 0", borderBottom: `1px solid ${border}` }}>
      <div>
        <div style={{ fontSize: 13.5, color: "#3A3A44" }}>{label}</div>
        {hint && <div style={{ fontSize: 11.5, color: muted, marginTop: 2 }}>{hint}</div>}
      </div>
      <div style={{ fontSize: 13.5, color: "#1F3A5F", fontWeight: 600 }}>{children}</div>
    </div>
  );
}

function MemoRow({ label, children, last }) {
  return (
    <div style={{ display: "flex", borderBottom: last ? "none" : `1px solid ${border}` }}>
      <div style={{ width: 110, flexShrink: 0, padding: "12px 14px", background: "#F6F6F9", fontSize: 11.5, fontWeight: 700, color: "#3A3A44", letterSpacing: 0.4 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ flex: 1, padding: "10px 14px", display: "flex", alignItems: "center", fontSize: 13.5, color: ink }}>
        {children}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${border}`,
  fontSize: 13.5, background: "#FCFCFD", color: ink, boxSizing: "border-box",
};

const memoInputStyle = {
  width: "100%", padding: "6px 0", border: "none", borderBottom: `1px solid transparent`,
  fontSize: 13, background: "transparent", color: ink, boxSizing: "border-box", outline: "none",
};

const requestBoxStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${border}`,
  fontSize: 13.5, background: "#FFFFFF", color: ink, boxSizing: "border-box", outline: "none",
};

const requestAreaStyle = {
  resize: "vertical", fontFamily: "inherit", minHeight: 76, lineHeight: 1.5,
};

createRoot(document.getElementById("root")).render(<OpsConsole />);
