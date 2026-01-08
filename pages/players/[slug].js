import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect, useMemo } from "react";
import styles from "@/styles/PlayerDetail.module.css";
import { formatCurrency, formatDate } from "@/utils/formatters";
import ThemeToggle from "@/components/ThemeToggle";
import Comments from "@/components/Comments";
import { trackUserAction } from "@/hooks/useActionTracker";

export default function PlayerDetail() {
  const router = useRouter();
  const { slug } = router.query;
  
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [votes, setVotes] = useState({ upvotes: 0, downvotes: 0, score: 0 });
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/transfer-portal?sport=football&year=2026");
        if (res.ok) {
          setPortalData(await res.json());
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const player = useMemo(() => {
    if (!portalData?.pageProps?.players || !slug) return null;
    return portalData.pageProps.players.find((p) => p.slug === slug) || null;
  }, [portalData, slug]);

  // Fetch comment count and votes
  useEffect(() => {
    async function fetchCommentCount() {
      if (!player?.key) return;
      try {
        const res = await fetch(`/api/comments?playerId=${player.key}`);
        if (res.ok) {
          const data = await res.json();
          setCommentCount(data.length || 0);
        }
      } catch (err) {
        console.error("Error fetching comments:", err);
      }
    }
    
    async function fetchVotes() {
      if (!player?.key) return;
      try {
        const res = await fetch(`/api/votes?playerId=${player.key}`);
        if (res.ok) {
          const data = await res.json();
          setVotes(data);
        }
      } catch (err) {
        console.error("Error fetching votes:", err);
      }
    }
    
    fetchCommentCount();
    fetchVotes();
    
    // Track player view
    if (player?.key && player?.name) {
      trackUserAction('view_player', 'player', player.key.toString(), player.name, {
        position: player.positionAbbreviation,
        slug: player.slug
      });
    }
  }, [player?.key, player?.name, player?.positionAbbreviation, player?.slug]);

  async function handleVote(voteType) {
    if (!player?.key || voting) return;
    setVoting(true);
    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: player.key.toString(), voteType })
      });
      if (res.ok) {
        const data = await res.json();
        setVotes(data);
        
        // Track the vote action
        trackUserAction(
          voteType === 'up' ? 'upvote' : 'downvote',
          'player',
          player.key.toString(),
          player.name,
          { source: 'player_detail' }
        );
      }
    } catch (err) {
      console.error("Error voting:", err);
    } finally {
      setVoting(false);
    }
  }

  // Close modal on escape key
  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape') setChatOpen(false);
    }
    if (chatOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [chatOpen]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>LOADING</p>
      </div>
    );
  }

  if (!player) {
    return (
      <div className={styles.errorContainer}>
        <h2>Player Not Found</h2>
        <p>Could not find player: {slug}</p>
        <Link href="/" className={styles.backLink}>← Back to Rankings</Link>
      </div>
    );
  }

  const rating = player.transferRating || player.rosterRating || player.rating || {};
  const commitStatus = player.commitStatus || {};
  const org = commitStatus.committedOrganization;
  const lastTeam = player.lastTeam;
  const valuation = player.valuation || {};

  const statusType = player.recStatus === "Enrolled" ? "enrolled" : org ? "committed" : "searching";
  const statusText = player.recStatus || (org ? "Committed" : "In Portal");

  return (
    <>
      <Head>
        <title>{player.name} | Off2</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/" className={styles.backLink}>← Back</Link>
          <Link href="/" className={styles.logoLink}>
            <img src="/off21.jpg" alt="Off2" className={`${styles.logoImg} ${styles.logoDark}`} />
            <img src="/off2.jpg" alt="Off2" className={`${styles.logoImg} ${styles.logoLight}`} />
          </Link>
          <div className={styles.headerActions}>
            <button 
              className={styles.chatButton}
              onClick={() => setChatOpen(true)}
              aria-label="Open chat"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {commentCount > 0 && (
                <span className={styles.chatBadge}>{commentCount}</span>
              )}
            </button>
            <ThemeToggle />
          </div>
        </header>

        <main className={styles.main}>
          {/* Player Card */}
          <div className={styles.playerCard}>

            {/* Top Section */}
            <div className={styles.cardTop}>
              <div className={styles.imageWrapper}>
                {player.defaultAssetUrl ? (
                  <img src={player.defaultAssetUrl} alt={player.name} className={styles.playerImage} />
                ) : (
                  <div className={styles.playerImagePlaceholder}>{player.name?.charAt(0)}</div>
                )}
                {player.index != null && (
                  <span className={styles.rankBadge}>#{player.index + 1}</span>
                )}
              </div>

              <div className={styles.playerHeader}>
                <div className={styles.nameRow}>
                  <h1 className={styles.playerName}>{player.name}</h1>
                  <span className={`${styles.statusPill} ${styles[statusType]}`}>{statusText}</span>
                </div>
                
                <div className={styles.metaRow}>
                  {player.positionAbbreviation && (
                    <span className={styles.positionBadge}>{player.positionAbbreviation}</span>
                  )}
                  {player.height && <span>{player.height}</span>}
                  {player.weight && <span>{player.weight} lbs</span>}
                  {commitStatus.classRank && <span>{commitStatus.classRank}</span>}
                </div>

                {player.homeTownName && (
                  <p className={styles.hometown}>{player.homeTownName}</p>
                )}

                {/* Transfer Flow */}
                <div className={styles.transferFlow}>
                  {lastTeam && (
                    <div className={styles.schoolChip}>
                      {(lastTeam.assetUrl?.url || lastTeam.asset?.source) && (
                        <img 
                          src={lastTeam.assetUrl?.url || `https://${lastTeam.asset?.domain}${lastTeam.asset?.source}`} 
                          alt="" 
                          className={styles.schoolLogo} 
                        />
                      )}
                      <span>{lastTeam.name || lastTeam.fullName}</span>
                    </div>
                  )}
                  <span className={styles.arrow}>→</span>
                  {org ? (
                    <div className={styles.schoolChip}>
                      {org.assetUrl && <img src={org.assetUrl} alt="" className={styles.schoolLogo} />}
                      <span>{org.name || org.fullName}</span>
                    </div>
                  ) : (
                    <span className={styles.portalChip}>In Portal</span>
                  )}
                </div>

                {/* Subtle Voting */}
                <div className={styles.voteWidget}>
                  <button onClick={() => handleVote('up')} disabled={voting} className={styles.voteUp}>
                    ▲ {votes.upvotes}
                  </button>
                  <button onClick={() => handleVote('down')} disabled={voting} className={styles.voteDown}>
                    ▼ {votes.downvotes}
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {rating.stars || rating.consensusStars || "—"}
                  {(rating.stars || rating.consensusStars) && <span className={styles.star}>★</span>}
                </span>
                <span className={styles.statLabel}>Stars</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statValue}>{(rating.rating || rating.consensusRating)?.toFixed(1) || "—"}</span>
                <span className={styles.statLabel}>Rating</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statValue}>#{rating.nationalRank || rating.consensusNationalRank || "—"}</span>
                <span className={styles.statLabel}>National</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statValue}>#{rating.positionRank || rating.consensusPositionRank || "—"}</span>
                <span className={styles.statLabel}>{rating.positionAbbr || player.positionAbbreviation || "Pos"}</span>
              </div>
            </div>

            {/* Details Grid */}
            <div className={styles.detailsGrid}>
              {player.highSchool && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>High School</span>
                  <span className={styles.detailValue}>{player.highSchool.name || player.highSchool.fullName}</span>
                </div>
              )}
              {player.classYear && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Class</span>
                  <span className={styles.detailValue}>{player.classYear}</span>
                </div>
              )}
              {commitStatus.transferEntered && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Entered Portal</span>
                  <span className={styles.detailValue}>{formatDate(commitStatus.transferEntered)}</span>
                </div>
              )}
              {commitStatus.date && org && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Committed</span>
                  <span className={styles.detailValue}>{formatDate(commitStatus.date)}</span>
                </div>
              )}
              {valuation.totalValue && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>NIL Value</span>
                  <span className={styles.detailValueHighlight}>{formatCurrency(valuation.totalValue)}</span>
                </div>
              )}
            </div>

            {/* Predictions - only show if still in portal */}
            {!org && player.predictions && player.predictions.length > 0 && (
              <div className={styles.predictionsSection}>
                <span className={styles.predictionsTitle}>Predictions</span>
                <div className={styles.predictionsList}>
                  {player.predictions.slice(0, 5).map((pred, idx) => (
                    <div key={idx} className={styles.predictionItem}>
                      {pred.organization?.name || pred.organization?.fullName || pred.organization?.abbreviation}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Articles */}
            {(player.committedArticle || player.enteredArticle) && (
              <div className={styles.articlesRow}>
                {player.committedArticle && (
                  <a 
                    href={`https://www.on3.com${player.committedArticle.fullUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.articleLink}
                  >
                    <span className={styles.articleIcon}>📰</span>
                    <span>{player.committedArticle.title}</span>
                  </a>
                )}
                {player.enteredArticle && (
                  <a 
                    href={`https://www.on3.com${player.enteredArticle.fullUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.articleLink}
                  >
                    <span className={styles.articleIcon}>📰</span>
                    <span>{player.enteredArticle.title}</span>
                  </a>
                )}
              </div>
            )}

            {/* View on On3 */}
            <a
              href={`https://www.on3.com/db/${player.slug}/`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.on3Link}
            >
              View on On3.com →
            </a>
          </div>
        </main>
      </div>

      {/* Chat Modal */}
      {chatOpen && (
        <div className={styles.modalOverlay} onClick={() => setChatOpen(false)}>
          <div 
            className={styles.modalContent} 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className={styles.modalClose}
              onClick={() => setChatOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <Comments playerId={player.key?.toString()} playerName={player.name} />
          </div>
        </div>
      )}
    </>
  );
}
