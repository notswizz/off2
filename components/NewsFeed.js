import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '@/styles/NewsFeed.module.css';
import { trackUserAction } from '@/hooks/useActionTracker';

function formatTimeAgo(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCurrency(value) {
  if (!value) return null;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}

function EventCard({ event, onVote, votes, players }) {
  const router = useRouter();
  const playerVotes = votes[event.playerId] || { upvotes: 0, downvotes: 0 };
  const score = playerVotes.upvotes - playerVotes.downvotes;
  const playerData = players[event.playerId] || {};
  const stars = event.stars || playerData.stars || 0;

  const handleVote = async (e, voteType) => {
    e.preventDefault();
    e.stopPropagation();
    onVote(event.playerId, voteType, event.playerName);
  };

  const handleClick = () => {
    router.push(`/players/${event.playerSlug}`);
  };

  return (
    <div className={styles.eventCard} onClick={handleClick}>
      {/* Stars Column */}
      {stars > 0 && (
        <div className={styles.starsCol}>
          {Array.from({ length: stars }).map((_, i) => (
            <span key={i} className={styles.star}>★</span>
          ))}
        </div>
      )}

      {/* Player Image */}
      <div className={styles.imgCol}>
        {event.playerImage ? (
          <img src={event.playerImage} alt="" className={styles.playerImg} />
        ) : (
          <div className={styles.playerImgPlaceholder}>
            {event.playerName?.charAt(0)}
          </div>
        )}
      </div>

      {/* Logo/Icon Column */}
      <div className={styles.logoCol}>
        {event.type === 'ranking_change' ? (
          <div className={styles.rankIcon}>📊</div>
        ) : event.toSchool && event.toSchoolLogo ? (
          <img src={event.toSchoolLogo} alt="" className={styles.bigLogo} />
        ) : (
          <div className={styles.portalIcon}>🚪</div>
        )}
      </div>

      {/* Info */}
      <div className={styles.infoCol}>
        {/* Top: Name + Position + Old School/Time top right */}
        <div className={styles.topLine}>
          <div className={styles.nameGroup}>
            <span className={styles.name}>{event.playerName}</span>
            {event.position && <span className={styles.pos}>{event.position}</span>}
          </div>
          <div className={styles.topRight}>
            {event.fromSchool && <span className={styles.fromSchool}>{event.fromSchool}</span>}
            <span className={styles.time}>{formatTimeAgo(event.timestamp)}</span>
          </div>
        </div>

        {/* Content based on event type */}
        {event.type === 'ranking_change' ? (
          <div className={styles.rankChange}>
            #{event.oldRank} → <span className={event.newRank < event.oldRank ? styles.rankUp : styles.rankDown}>#{event.newRank}</span>
          </div>
        ) : event.toSchool ? (
          <div className={styles.toSchool}>{event.toSchool}</div>
        ) : (
          <div className={styles.inPortal}>Entered Portal</div>
        )}

        {/* Votes + Emoji */}
        <div className={styles.voteRow}>
          <button className={styles.voteBtn} onClick={(e) => handleVote(e, 'up')}>
            ▲{playerVotes.upvotes}
          </button>
          <span className={`${styles.voteScore} ${score > 0 ? styles.scoreUp : score < 0 ? styles.scoreDown : ''}`}>
            {score > 0 ? '+' : ''}{score}
          </span>
          <button className={styles.voteBtn} onClick={(e) => handleVote(e, 'down')}>
            {playerVotes.downvotes}▼
          </button>
          <span className={styles.emoji}>
            {event.type === 'portal_entry' && '🚪'}
            {event.type === 'commitment' && '✍️'}
            {event.type === 'nil_change' && '💰'}
            {event.type === 'ranking_change' && '📊'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function NewsFeed({ isOpen, onClose }) {
  const [events, setEvents] = useState([]);
  const [votes, setVotes] = useState({});
  const [players, setPlayers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'portal_entry', 'commitment'

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Fetch events and player data in parallel
      const [eventsRes, portalRes] = await Promise.all([
        fetch(`/api/events?limit=50`),
        fetch(`/api/transfer-portal?sport=football&year=2026`)
      ]);
      
      const eventsData = await eventsRes.json();
      const portalData = await portalRes.json();
      
      if (eventsData.error) {
        setError(eventsData.error);
      } else {
        const eventsList = eventsData.events || [];
        setEvents(eventsList);
        setError(null);
        
        // Build player lookup map for stars/rating
        const playersMap = {};
        const portalPlayers = portalData?.pageProps?.players || [];
        portalPlayers.forEach(p => {
          const rating = p.transferRating || p.rosterRating || p.rating || {};
          playersMap[p.key] = {
            stars: rating.consensusStars || rating.stars || 0,
            rating: rating.consensusRating || rating.rating || 0
          };
        });
        setPlayers(playersMap);
        
        // Fetch votes for all players in events
        const playerIds = [...new Set(eventsList.map(e => e.playerId))];
        const votesMap = {};
        await Promise.all(
          playerIds.map(async (playerId) => {
            try {
              const voteRes = await fetch(`/api/votes?playerId=${playerId}`);
              if (voteRes.ok) {
                votesMap[playerId] = await voteRes.json();
              }
            } catch (err) {
              // Ignore individual vote fetch errors
            }
          })
        );
        setVotes(votesMap);
      }
    } catch (err) {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (playerId, voteType, playerName) => {
    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: String(playerId), voteType })
      });
      if (res.ok) {
        const data = await res.json();
        setVotes(prev => ({
          ...prev,
          [playerId]: data
        }));
        
        // Track the vote action
        trackUserAction(
          voteType === 'up' ? 'upvote' : 'downvote',
          'player',
          String(playerId),
          playerName,
          { source: 'activity_feed' }
        );
      }
    } catch (err) {
      console.error('Vote error:', err);
    }
  };

  if (!isOpen) return null;

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(e => e.type === filter);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Activity</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <button 
            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'portal_entry' ? styles.active : ''}`}
            onClick={() => setFilter('portal_entry')}
          >
            🚪 Enters
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'commitment' ? styles.active : ''}`}
            onClick={() => setFilter('commitment')}
          >
            ✍️ Commits
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'ranking_change' ? styles.active : ''}`}
            onClick={() => setFilter('ranking_change')}
          >
            📊 Rankings
          </button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.loader}></div>
            </div>
          ) : error ? (
            <div className={styles.empty}>
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className={styles.empty}>
              <span>📭</span>
              <p>No activity yet</p>
            </div>
          ) : (
            <div className={styles.eventsList}>
              {filteredEvents.map((event) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  votes={votes}
                  players={players}
                  onVote={handleVote}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
