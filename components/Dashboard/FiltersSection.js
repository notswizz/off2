import styles from '@/styles/Dashboard.module.css';

export default function FiltersSection({ 
  searchTerm, 
  onSearchChange, 
  positionFilter, 
  onPositionChange,
  statusFilter,
  onStatusChange,
  positions,
  totalCount,
  filteredCount 
}) {
  return (
    <section className={styles.filtersSection}>
      <div className={styles.searchBox}>
        <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search players, teams..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.filterGroup}>
        <select
          value={positionFilter}
          onChange={(e) => onPositionChange(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Positions</option>
          {positions.map((pos) => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Status</option>
          <option value="committed">Committed</option>
          <option value="inPortal">In Portal</option>
        </select>
      </div>

      <div className={styles.resultsCount}>
        {filteredCount.toLocaleString()} players
      </div>
    </section>
  );
}
