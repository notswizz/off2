import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import styles from "@/styles/Analytics.module.css";
import ThemeToggle from "@/components/ThemeToggle";

function formatCurrency(value) {
  if (!value) return '$0';
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(2)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}

export default function Analytics() {
  const [yearSummary, setYearSummary] = useState([]);
  const [teams, setTeams] = useState([]);
  const [topPlayers, setTopPlayers] = useState([]);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [teamHistory, setTeamHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  useEffect(() => {
    if (selectedTeam !== 'all') {
      fetchTeamHistory(selectedTeam);
    } else {
      setTeamHistory(null);
    }
  }, [selectedTeam]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, teamsRes, playersRes] = await Promise.all([
        fetch('/api/historical?type=summary'),
        fetch(`/api/historical?type=teams&year=${selectedYear}`),
        fetch(`/api/historical?type=top-nil&year=${selectedYear}`),
      ]);

      const summaryData = await summaryRes.json();
      const teamsData = await teamsRes.json();
      const playersData = await playersRes.json();

      setYearSummary(summaryData.years || []);
      setTeams(teamsData.teams || []);
      setTopPlayers(playersData.players || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamHistory = async (teamId) => {
    try {
      const res = await fetch(`/api/historical?type=team-history&team=${teamId}`);
      const data = await res.json();
      setTeamHistory(data);
    } catch (error) {
      console.error('Error fetching team history:', error);
    }
  };

  // Filter players by selected team
  const filteredPlayers = selectedTeam === 'all' 
    ? topPlayers 
    : topPlayers.filter(p => {
        const team = teams.find(t => t.id === selectedTeam);
        return team && p.toSchool === team.name;
      });

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/sync-historical');
      const data = await res.json();
      console.log('Sync result:', data);
      await fetchData();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const chartColors = ['#00d47e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <>
      <Head>
        <title>Analytics | Off2</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/" className={styles.backLink}>← Rankings</Link>
          <div className={styles.logo}>
            <span className={styles.logoOn3}>Off</span>
            <span className={styles.logoNil}>2</span>
          </div>
          <ThemeToggle />
        </header>

        <main className={styles.main}>
          <div className={styles.titleRow}>
            <div>
              <h1 className={styles.title}>NIL Analytics</h1>
              <p className={styles.subtitle}>Historical transfer portal data & trends</p>
            </div>
            <button 
              className={styles.syncBtn} 
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? 'Syncing...' : '🔄 Sync Historical Data'}
            </button>
          </div>

          {loading ? (
            <div className={styles.loading}>
              <div className={styles.loader}></div>
              <p>Loading analytics...</p>
            </div>
          ) : yearSummary.length === 0 ? (
            <div className={styles.empty}>
              <p>No historical data yet</p>
              <p className={styles.emptyHint}>Click "Sync Historical Data" to fetch data for 2024-2026</p>
            </div>
          ) : (
            <>
              {/* Year Selector */}
              <div className={styles.filterRow}>
                <div className={styles.yearSelector}>
                  {['2024', '2025', '2026'].map(year => (
                    <button
                      key={year}
                    className={`${styles.yearBtn} ${selectedYear === year ? styles.active : ''}`}
                    onClick={() => { setSelectedYear(year); setShowAll(false); }}
                    >
                      {year}
                    </button>
                  ))}
                </div>
                
                <select 
                  className={styles.teamSelect}
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                >
                  <option value="all">All Teams</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

              {/* Summary Cards */}
              <div className={styles.statsGrid}>
                {yearSummary.map(year => (
                  <div 
                    key={year.year} 
                    className={`${styles.statCard} ${year.year === selectedYear ? styles.activeYear : ''}`}
                  >
                    <span className={styles.statYear}>{year.year}</span>
                    <span className={styles.statValue}>{formatCurrency(year.totalNilValue)}</span>
                    <span className={styles.statLabel}>Total NIL Value</span>
                    <div className={styles.statMeta}>
                      <span>{year.totalPlayers} players</span>
                      <span>{year.teamCount} teams</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Year over Year Chart */}
              <section className={styles.chartSection}>
                <h2 className={styles.sectionTitle}>Total NIL Value by Year</h2>
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={yearSummary}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="year" stroke="rgba(255,255,255,0.5)" />
                      <YAxis 
                        stroke="rgba(255,255,255,0.5)" 
                        tickFormatter={(v) => formatCurrency(v)}
                      />
                      <Tooltip 
                        formatter={(v) => formatCurrency(v)}
                        contentStyle={{ 
                          background: 'var(--bg-card)', 
                          border: '1px solid var(--border)',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="totalNilValue" fill="#00d47e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Team History Chart (when team selected) */}
              {teamHistory && teamHistory.history?.length > 0 && (
                <section className={styles.chartSection}>
                  <h2 className={styles.sectionTitle}>
                    {teamHistory.history[0]?.name || 'Team'} NIL History
                  </h2>
                  <div className={styles.chartContainer}>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={teamHistory.history}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="year" stroke="rgba(255,255,255,0.5)" />
                        <YAxis 
                          stroke="rgba(255,255,255,0.5)" 
                          tickFormatter={(v) => formatCurrency(v)}
                        />
                        <Tooltip 
                          formatter={(v) => formatCurrency(v)}
                          contentStyle={{ 
                            background: 'var(--bg-card)', 
                            border: '1px solid var(--border)',
                            borderRadius: '8px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="totalNil" 
                          stroke="#00d47e" 
                          strokeWidth={3}
                          dot={{ fill: '#00d47e', strokeWidth: 2, r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className={styles.teamStats}>
                    {teamHistory.history.map(h => (
                      <div key={h.year} className={styles.teamStatItem}>
                        <span className={styles.teamStatYear}>{h.year}</span>
                        <span className={styles.teamStatValue}>{formatCurrency(h.totalNil)}</span>
                        <span className={styles.teamStatPlayers}>{h.playerCount} players</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Top Teams Chart */}
              <section className={styles.chartSection}>
                <h2 className={styles.sectionTitle}>Top Teams by NIL ({selectedYear})</h2>
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={teams.slice(0, 15)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis type="number" stroke="rgba(255,255,255,0.5)" tickFormatter={(v) => formatCurrency(v)} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="rgba(255,255,255,0.5)" 
                        width={120}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(v) => formatCurrency(v)}
                        contentStyle={{ 
                          background: 'var(--bg-card)', 
                          border: '1px solid var(--border)',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="totalNil" radius={[0, 4, 4, 0]}>
                        {teams.slice(0, 15).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Top Players Table */}
              <section className={styles.tableSection}>
                <h2 className={styles.sectionTitle}>
                  All Players ({selectedYear}) 
                  <span className={styles.playerCount}>({filteredPlayers.length} players)</span>
                  {selectedTeam !== 'all' && teams.find(t => t.id === selectedTeam) && (
                    <span className={styles.teamFilter}> - {teams.find(t => t.id === selectedTeam)?.name}</span>
                  )}
                </h2>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Player</th>
                        <th>Pos</th>
                        <th>School</th>
                        <th>NIL Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(showAll ? filteredPlayers : filteredPlayers.slice(0, 50)).map((player, idx) => (
                        <tr key={player.id}>
                          <td className={styles.rank}>{idx + 1}</td>
                          <td>
                            <Link href={`/players/${player.slug}`} className={styles.playerLink}>
                              <div className={styles.playerInfo}>
                                {player.imageUrl && (
                                  <img src={player.imageUrl} alt={player.name} className={styles.playerImage} />
                                )}
                                <span>{player.name}</span>
                              </div>
                            </Link>
                          </td>
                          <td>{player.position || '—'}</td>
                          <td>{player.toSchool || 'Uncommitted'}</td>
                          <td className={styles.nilValue}>
                            {player.nilValue ? formatCurrency(player.nilValue) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredPlayers.length > 50 && !showAll && (
                  <button className={styles.showMoreBtn} onClick={() => setShowAll(true)}>
                    Show All {filteredPlayers.length} Players
                  </button>
                )}
                {showAll && filteredPlayers.length > 50 && (
                  <button className={styles.showMoreBtn} onClick={() => setShowAll(false)}>
                    Show Less
                  </button>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </>
  );
}

