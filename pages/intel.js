import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '@/styles/Intel.module.css';
import ThemeToggle from '@/components/ThemeToggle';

export default function IntelPage() {
  const [playerName, setPlayerName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [activeTab, setActiveTab] = useState('analyze');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      const res = await fetch('/api/recruiting-predictions?limit=20');
      const data = await res.json();
      if (data.predictions) {
        setPredictions(data.predictions);
      }
    } catch (err) {
      console.error('Failed to fetch predictions:', err);
    }
  };

  const runAnalysis = async () => {
    if (!playerName.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await fetch('/api/analyze-recruiting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: playerName.trim() })
      });

      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setAnalysis(data);
        if (data.predictions?.length > 0) {
          await fetch('/api/recruiting-predictions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              player: playerName.trim(),
              predictions: data.predictions,
              analysis: data.summary
            })
          });
          fetchPredictions();
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const checkSignals = async () => {
    if (!playerName.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze-recruiting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: playerName.trim(), mode: 'signals' })
      });

      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setAnalysis(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return '#22c55e';
    if (confidence >= 60) return '#eab308';
    if (confidence >= 40) return '#f97316';
    return 'var(--text-muted)';
  };

  const getUrgencyBadge = (urgency) => {
    const colors = {
      high: { bg: '#dc2626', text: '#fff' },
      medium: { bg: '#f59e0b', text: '#000' },
      low: { bg: 'var(--bg-card)', text: 'var(--text-secondary)' }
    };
    return colors[urgency] || colors.low;
  };

  return (
    <>
      <Head>
        <title>Intel Hub | AI Recruiting Analysis</title>
        <meta name="description" content="AI-powered recruiting trend analysis" />
      </Head>

      <div className={styles.container}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>⚡</span>
            <span>Portal Intel</span>
          </Link>
          <div className={styles.navLinks}>
            <Link href="/">Dashboard</Link>
            <Link href="/intel" className={styles.active}>Intel Hub</Link>
          </div>
          <ThemeToggle />
        </nav>

        <main className={styles.main}>
          <header className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>
                <span className={styles.aiIcon}>🧠</span>
                Intel Hub
              </h1>
              <p className={styles.subtitle}>
                AI-powered web search for recruiting intel
              </p>
            </div>
          </header>

          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'analyze' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('analyze')}
            >
              <span>🔍</span> Analyze Player
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'predictions' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('predictions')}
            >
              <span>📊</span> History ({predictions.length})
            </button>
          </div>

          {activeTab === 'analyze' && (
            <section className={styles.analyzeSection}>
              <div className={styles.searchCard}>
                <div className={styles.searchHeader}>
                  <h2>Player Analysis</h2>
                  <p>Search the web for recruiting news, crystal balls, and commitment intel</p>
                </div>
                
                <div className={styles.searchInputGroup}>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Enter player name (e.g., Byrum Brown)"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && runAnalysis()}
                  />
                  <div className={styles.searchButtons}>
                    <button 
                      className={styles.analyzeBtn}
                      onClick={runAnalysis}
                      disabled={isAnalyzing || !playerName.trim()}
                    >
                      {isAnalyzing ? (
                        <>
                          <span className={styles.spinner}></span>
                          Searching...
                        </>
                      ) : (
                        <>🔮 Full Analysis</>
                      )}
                    </button>
                    <button 
                      className={styles.signalsBtn}
                      onClick={checkSignals}
                      disabled={isAnalyzing || !playerName.trim()}
                    >
                      ⚡ Quick Signals
                    </button>
                  </div>
                </div>

                {isAnalyzing && (
                  <div className={styles.loadingState}>
                    <div className={styles.loadingAnimation}>
                      <div className={styles.pulse}></div>
                    </div>
                    <p>Searching web for recruiting intel...</p>
                    <span className={styles.loadingHint}>Checking On3, 247, ESPN, news sites...</span>
                  </div>
                )}

                {error && (
                  <div className={styles.errorBox}>
                    <span>⚠️</span>
                    <p>{error}</p>
                  </div>
                )}
              </div>

              {analysis && (
                <div className={styles.resultsCard}>
                  {/* Header */}
                  <div className={styles.resultsHeader}>
                    <div className={styles.playerTitle}>
                      <h2>{analysis.player}</h2>
                      {analysis.webSearchEnabled && (
                        <span className={styles.webSearchBadge}>🌐 Web Search</span>
                      )}
                    </div>
                    {analysis.urgency && (
                      <span 
                        className={styles.urgencyBadge}
                        style={{ 
                          background: getUrgencyBadge(analysis.urgency).bg,
                          color: getUrgencyBadge(analysis.urgency).text
                        }}
                      >
                        {analysis.urgency.toUpperCase()} URGENCY
                      </span>
                    )}
                  </div>

                  {/* Summary */}
                  {analysis.summary && (
                    <div className={styles.summaryBox}>
                      <p>{analysis.summary}</p>
                    </div>
                  )}

                  {/* Timeline */}
                  {analysis.timeline && (
                    <div className={styles.timelineBox}>
                      <h3>📅 Timeline</h3>
                      <p>{analysis.timeline}</p>
                    </div>
                  )}

                  {/* Predictions */}
                  {analysis.predictions?.length > 0 && (
                    <div className={styles.predictionsBox}>
                      <h3>🎯 Predictions</h3>
                      <div className={styles.predictionsList}>
                        {analysis.predictions.map((pred, i) => (
                          <div key={i} className={styles.predictionItem}>
                            <div className={styles.predictionMain}>
                              {pred.logo && (
                                <img src={pred.logo} alt="" className={styles.schoolLogo} />
                              )}
                              <span className={styles.schoolName}>{pred.school}</span>
                              <span 
                                className={styles.confidenceBadge}
                                style={{ background: getConfidenceColor(pred.confidence) }}
                              >
                                {pred.confidence}%
                              </span>
                            </div>
                            {(pred.reason || pred.reasoning) && (
                              <p className={styles.reasoning}>{pred.reason || pred.reasoning}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Crystal Balls */}
                  {analysis.crystalBalls && (
                    <div className={styles.crystalBallBox}>
                      <h3>🔮 Crystal Ball Predictions</h3>
                      <p>{analysis.crystalBalls}</p>
                    </div>
                  )}

                  {/* Key Insights */}
                  {analysis.keyInsights?.length > 0 && (
                    <div className={styles.insightsBox}>
                      <h3>💡 Key Intel</h3>
                      <ul>
                        {analysis.keyInsights.map((insight, i) => (
                          <li key={i}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Visits */}
                  {(analysis.visitsMentioned?.length > 0 || analysis.visits?.length > 0) && (
                    <div className={styles.visitsBox}>
                      <h3>🏟️ Visits</h3>
                      <div className={styles.visitTags}>
                        {(analysis.visits || analysis.visitsMentioned)?.map((visit, i) => (
                          <span key={i} className={styles.visitTag}>
                            {visit.logo && <img src={visit.logo} alt="" className={styles.visitLogo} />}
                            {visit.name || visit}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sentiment */}
                  {analysis.sentiment && (
                    <div className={styles.sentimentBox}>
                      <h3>📈 Sentiment</h3>
                      <div className={styles.sentimentGrid}>
                        <div className={styles.sentimentItem}>
                          <span>Overall</span>
                          <strong className={styles[analysis.sentiment.overall]}>
                            {analysis.sentiment.overall}
                          </strong>
                        </div>
                        <div className={styles.sentimentItem}>
                          <span>Momentum</span>
                          <strong>{analysis.sentiment.momentum}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Commitment Signals */}
                  {analysis.signals?.length > 0 && (
                    <div className={styles.signalsBox}>
                      <h3>⚡ Commitment Signals</h3>
                      <ul>
                        {analysis.signals.map((signal, i) => (
                          <li key={i}>{signal}</li>
                        ))}
                      </ul>
                      {analysis.possibleDate && (
                        <div className={styles.signalHighlight}>
                          <strong>📆 Possible Date:</strong> {analysis.possibleDate}
                        </div>
                      )}
                      {analysis.likelyDestination && (
                        <div className={styles.signalHighlight}>
                          <strong>🏈 Likely Destination:</strong> {analysis.likelyDestination}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sources */}
                  {analysis.sources?.length > 0 && (
                    <div className={styles.sourcesBox}>
                      <h3>📰 Sources</h3>
                      <ul className={styles.sourcesList}>
                        {analysis.sources.map((source, i) => (
                          <li key={i}>
                            {source.startsWith('http') ? (
                              <a href={source} target="_blank" rel="noopener noreferrer">
                                {source.replace(/https?:\/\/(www\.)?/, '').split('/')[0]}
                              </a>
                            ) : (
                              <span>{source}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Web Search Sources */}
                  {analysis.webSearchSources?.length > 0 && (
                    <div className={styles.sourcesBox}>
                      <h3>🔗 Web Search Results</h3>
                      <ul className={styles.sourcesList}>
                        {analysis.webSearchSources.slice(0, 8).map((source, i) => (
                          <li key={i}>
                            <a href={source.url} target="_blank" rel="noopener noreferrer">
                              {source.title || source.url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Meta */}
                  <div className={styles.resultsMeta}>
                    <span>🤖 {analysis.model || 'GPT-4.1'}</span>
                    {analysis.webSearchEnabled && <span>🌐 Web Search</span>}
                    <span>⏱️ {new Date(analysis.analysisTimestamp || analysis.analyzedAt).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === 'predictions' && (
            <section className={styles.predictionsSection}>
              <div className={styles.predictionsGrid}>
                {predictions.length === 0 ? (
                  <div className={styles.emptyState}>
                    <span>📭</span>
                    <p>No predictions yet. Run an analysis to get started!</p>
                  </div>
                ) : (
                  predictions.map((pred) => (
                    <div key={pred.id} className={styles.predictionCard}>
                      <div className={styles.predCardHeader}>
                        <h3>{pred.player}</h3>
                        <span className={styles.timestamp}>
                          {new Date(pred.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {pred.analysis && (
                        <p className={styles.predAnalysis}>{pred.analysis}</p>
                      )}
                      {pred.predictions?.length > 0 && (
                        <div className={styles.predSchools}>
                          {pred.predictions.slice(0, 3).map((p, i) => (
                            <div key={i} className={styles.predSchool}>
                              <span className={styles.predSchoolName}>{p.school}</span>
                              <span 
                                className={styles.predSchoolConf}
                                style={{ color: getConfidenceColor(p.confidence) }}
                              >
                                {p.confidence}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}
