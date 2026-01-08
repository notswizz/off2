import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect, useMemo } from "react";
import styles from "@/styles/PlayerDetail.module.css";
import { formatCurrency, formatNumber, formatDate } from "@/utils/formatters";
import { transformPortalPlayers } from "@/utils/dataTransformers";
import ThemeToggle from "@/components/ThemeToggle";

export default function PlayerDetail() {
  const router = useRouter();
  const { slug } = router.query;
  
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>LOADING PLAYER</p>
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

  return (
    <>
      <Head>
        <title>{player.name} | Off2</title>
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
          {/* Hero */}
          <section className={styles.hero}>
            <div className={styles.heroContent}>
              <div className={styles.playerImageContainer}>
                {player.defaultAssetUrl ? (
                  <img src={player.defaultAssetUrl} alt={player.name} className={styles.playerImage} />
                ) : (
                  <div className={styles.playerImagePlaceholder}>{player.name?.charAt(0)}</div>
                )}
                {player.index != null && (
                  <div className={styles.rankBadge}>#{player.index + 1}</div>
                )}
              </div>
              
              <div className={styles.playerInfo}>
                <h1 className={styles.playerName}>
                  {player.name}
                  {(rating.consensusStars || rating.stars) && (
                    <span className={styles.stars}>{"★".repeat(rating.consensusStars || rating.stars)}</span>
                  )}
                </h1>
                
                <div className={styles.playerMeta}>
                  {player.positionAbbreviation && (
                    <span className={styles.position}>{player.positionAbbreviation}</span>
                  )}
                  {player.height && <span className={styles.metaItem}>{player.height}</span>}
                  {player.weight && (
                    <>
                      <span className={styles.metaDivider}>•</span>
                      <span className={styles.metaItem}>{player.weight} lbs</span>
                    </>
                  )}
                  {commitStatus.classRank && (
                    <>
                      <span className={styles.metaDivider}>•</span>
                      <span className={styles.metaItem}>{commitStatus.classRank}</span>
                    </>
                  )}
                </div>

                {player.homeTownName && <p className={styles.hometown}>{player.homeTownName}</p>}

                {/* Transfer Flow */}
                <div className={styles.transferFlow}>
                  {lastTeam && (
                    <div className={styles.schoolBadge}>
                      {(lastTeam.assetUrl?.url || lastTeam.asset?.source) && (
                        <img 
                          src={lastTeam.assetUrl?.url || `https://${lastTeam.asset?.domain}${lastTeam.asset?.source}`} 
                          alt={lastTeam.name} 
                          className={styles.schoolLogo} 
                        />
                      )}
                      <span>{lastTeam.name || lastTeam.fullName}</span>
                    </div>
                  )}
                  {lastTeam && <span className={styles.transferArrow}>→</span>}
                  {org ? (
                    <div className={styles.schoolBadge}>
                      {org.assetUrl && <img src={org.assetUrl} alt={org.name} className={styles.schoolLogo} />}
                      <span>{org.name || org.fullName}</span>
                    </div>
                  ) : (
                    <span className={styles.inPortalBadge}>In Portal</span>
                  )}
                </div>
              </div>

              {/* Rating Display */}
              <div className={styles.valuationHero}>
                <div>
                  <span className={styles.valuationLabel}>Transfer Rating</span>
                  <div className={styles.valuationAmount}>
                    {(rating.consensusRating || rating.rating)?.toFixed(1) || "—"}
                  </div>
                </div>
                <span className={`${styles.statusBadge} ${
                  player.recStatus === "Enrolled" ? styles.enrolled :
                  org ? styles.committed : styles.searching
                }`}>
                  {player.recStatus || (org ? "Committed" : "In Portal")}
                </span>
                {commitStatus.transferEntered && (
                  <span className={styles.lastUpdated}>Entered {formatDate(commitStatus.transferEntered)}</span>
                )}
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className={styles.statsSection}>
            <h2 className={styles.sectionTitle}>Rankings</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>National Rank</span>
                <span className={styles.statValue}>#{rating.consensusNationalRank || rating.nationalRank || "—"}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Position Rank</span>
                <span className={styles.statValue}>#{rating.consensusPositionRank || rating.positionRank || "—"}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Rating</span>
                <span className={styles.statValue}>{(rating.consensusRating || rating.rating)?.toFixed(1) || "—"}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Stars</span>
                <span className={styles.statValue}>
                  {rating.consensusStars || rating.stars || "—"}
                  <span className={styles.starsSmall}>{"★".repeat(rating.consensusStars || rating.stars || 0)}</span>
                </span>
              </div>
            </div>
          </section>

          {/* Industry Comparison */}
          {(() => {
            const industryRatings = player.industryComparison?.filter(
              comp => comp.type !== "Industry" && comp.type !== "Consensus" && (comp.rating || comp.stars || comp.overallRank)
            ) || [];
            
            if (industryRatings.length === 0) return null;
            
            return (
              <section className={styles.socialSection}>
                <h2 className={styles.sectionTitle}>Industry Ratings</h2>
                <div className={styles.socialGrid}>
                  {industryRatings.map((comp) => (
                    <div key={comp.type} className={styles.socialCard}>
                      <div className={styles.socialHeader}>
                        <span className={styles.socialType}>{comp.type}</span>
                      </div>
                      <div className={styles.socialStats}>
                        {comp.rating && (
                          <div className={styles.socialStat}>
                            <span className={styles.socialStatValue}>{comp.rating.toFixed(1)}</span>
                            <span className={styles.socialStatLabel}>Rating</span>
                          </div>
                        )}
                        {comp.stars && (
                          <div className={styles.socialStat}>
                            <span className={styles.socialStatValue}>{comp.stars}★</span>
                            <span className={styles.socialStatLabel}>Stars</span>
                          </div>
                        )}
                        {comp.overallRank && (
                          <div className={styles.socialStat}>
                            <span className={styles.socialStatValue}>#{comp.overallRank}</span>
                            <span className={styles.socialStatLabel}>Rank</span>
                          </div>
                        )}
                      </div>
                      {comp.link && (
                        <a href={comp.link} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                          View Profile →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })()}

          {/* High School */}
          {player.highSchool && (
            <section className={styles.highSchoolSection}>
              <h2 className={styles.sectionTitle}>High School</h2>
              <div className={styles.highSchoolCard}>
                {(player.highSchool.assetUrl || player.highSchool.defaultAsset?.source) && (
                  <img 
                    src={player.highSchool.assetUrl || `https://${player.highSchool.defaultAsset?.domain}${player.highSchool.defaultAsset?.source}`} 
                    alt={player.highSchool.name} 
                    className={styles.hsLogo} 
                  />
                )}
                <div className={styles.hsInfo}>
                  <h3>{player.highSchool.name || player.highSchool.fullName}</h3>
                  {player.highSchool.mascot && <p className={styles.hsMascot}>{player.highSchool.mascot}</p>}
                </div>
              </div>
            </section>
          )}

          {/* Articles */}
          {(player.committedArticle || player.enteredArticle) && (
            <section className={styles.articlesSection}>
              <h2 className={styles.sectionTitle}>Related News</h2>
              <div className={styles.articlesGrid}>
                {player.committedArticle && (
                  <a 
                    href={`https://www.on3.com${player.committedArticle.fullUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.articleCard}
                  >
                    <span className={styles.articleBadge}>Committed</span>
                    <h3>{player.committedArticle.title}</h3>
                    <span className={styles.articleDate}>
                      {formatDate(player.committedArticle.datePublishedGmt)}
                    </span>
                  </a>
                )}
                {player.enteredArticle && (
                  <a 
                    href={`https://www.on3.com${player.enteredArticle.fullUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.articleCard}
                  >
                    <span className={styles.articleBadge}>Entered Portal</span>
                    <h3>{player.enteredArticle.title}</h3>
                    <span className={styles.articleDate}>
                      {formatDate(player.enteredArticle.datePublishedGmt)}
                    </span>
                  </a>
                )}
              </div>
            </section>
          )}

          {/* Info Pills */}
          <section className={styles.additionalSection}>
            <h2 className={styles.sectionTitle}>Details</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Sport</span>
                <span className={styles.infoValue}>Football</span>
              </div>
              {commitStatus.classRank && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Class Standing</span>
                  <span className={styles.infoValue}>{commitStatus.classRank}</span>
                </div>
              )}
              {player.nilStatus && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>NIL Status</span>
                  <span className={styles.infoValue}>{player.nilStatus}</span>
                </div>
              )}
              {valuation.totalValue && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>NIL Value</span>
                  <span className={styles.infoValue}>{formatCurrency(valuation.totalValue)}</span>
                </div>
              )}
            </div>
          </section>

          {/* External Link */}
          <section className={styles.externalSection}>
            <a
              href={`https://www.on3.com/db/${player.slug}/`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.externalLink}
            >
              View Full Profile on On3 →
            </a>
          </section>
        </main>

        <footer className={styles.footer}>
          <p>Data from <a href="https://www.on3.com" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>On3.com</a></p>
        </footer>
      </div>
    </>
  );
}
