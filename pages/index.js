import Head from "next/head";
import { useState, useEffect, useMemo } from "react";
import styles from "@/styles/Dashboard.module.css";

import { 
  transformPortalPlayers,
  filterPlayers, 
  sortPlayers, 
  getUniquePositions 
} from "@/utils/dataTransformers";

import { 
  FiltersSection, 
  PlayersTable, 
  Pagination 
} from "@/components/Dashboard";
import ThemeToggle from "@/components/ThemeToggle";
import NewsFeed from "@/components/NewsFeed";

const PLAYERS_PER_PAGE = 25;

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState("2026");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/transfer-portal?sport=football&year=${selectedYear}`);
        if (res.ok) {
          const data = await res.json();
          setPlayers(transformPortalPlayers(data));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedYear]);

  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rank");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [feedOpen, setFeedOpen] = useState(false);

  const positions = useMemo(() => getUniquePositions(players), [players]);

  const filteredPlayers = useMemo(() => {
    const filtered = filterPlayers(players, searchTerm, positionFilter, statusFilter);
    return sortPlayers(filtered, sortBy, sortOrder);
  }, [players, searchTerm, positionFilter, statusFilter, sortBy, sortOrder]);

  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * PLAYERS_PER_PAGE;
    return filteredPlayers.slice(start, start + PLAYERS_PER_PAGE);
  }, [filteredPlayers, currentPage]);

  const totalPages = Math.ceil(filteredPlayers.length / PLAYERS_PER_PAGE);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder(field === "name" || field === "school" ? "asc" : "desc");
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePositionChange = (value) => {
    setPositionFilter(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>LOADING PORTAL DATA</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Off2 | Transfer Portal Rankings</title>
        <meta name="description" content="Off2 - College Football Transfer Portal Rankings" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.container}>
        <main className={styles.main}>
          {/* Header */}
          <header className={styles.header}>
            <div className={styles.headerTop}>
              <div className={styles.titleGroup}>
                <span className={styles.badge}>Transfer Portal</span>
                <h1 className={styles.title}>
                  Off<span className={styles.titleAccent}>2</span>
                </h1>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button 
                  onClick={() => setFeedOpen(true)}
                  className={styles.notificationBtn}
                  aria-label="Open activity feed"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </button>
                <ThemeToggle />
              </div>
            </div>
          </header>

          <FiltersSection
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            positionFilter={positionFilter}
            onPositionChange={handlePositionChange}
            statusFilter={statusFilter}
            onStatusChange={handleStatusChange}
            yearFilter={selectedYear}
            onYearChange={(year) => { setSelectedYear(year); setCurrentPage(1); }}
            positions={positions}
            totalCount={paginatedPlayers.length}
            filteredCount={filteredPlayers.length}
          />
          
          <PlayersTable
            players={paginatedPlayers}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
          
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </main>

        <footer className={styles.footer}>
          <p>Data sourced from <a href="https://www.on3.com" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>On3.com</a></p>
        </footer>
      </div>

      <NewsFeed isOpen={feedOpen} onClose={() => setFeedOpen(false)} />
    </>
  );
}
