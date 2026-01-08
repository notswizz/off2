import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/styles/NewsFeed.module.css';

const EVENT_ICONS = {
  portal_entry: '🚪',
  commitment: '✍️',
  nil_change: '💰',
  ranking_change: '📊',
};

const EVENT_COLORS = {
  portal_entry: 'var(--searching)',
  commitment: 'var(--accent)',
  nil_change: 'var(--gold)',
  ranking_change: 'var(--committed)',
};

function formatTimeAgo(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

function formatCurrency(value) {
  if (!value) return '$0';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}

export default function NewsFeed({ isOpen, onClose }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events?limit=50`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setEvents(data.events || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <span className={styles.titleIcon}>🔔</span>
            Activity Feed
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.loader}></div>
              <p>Loading events...</p>
            </div>
          ) : error ? (
            <div className={styles.empty}>
              <p className={styles.emptyIcon}>⚠️</p>
              <p>{error}</p>
              <p className={styles.emptyHint}>Make sure Firebase is configured</p>
            </div>
          ) : events.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyIcon}>📭</p>
              <p>No events yet</p>
              <p className={styles.emptyHint}>Events will appear here when changes are detected</p>
            </div>
          ) : (
            <div className={styles.eventsList}>
              {events.map((event) => (
                <Link 
                  href={`/players/${event.playerSlug}`} 
                  key={event.id}
                  className={styles.eventCard}
                >
                  <div 
                    className={styles.eventIcon}
                    style={{ background: EVENT_COLORS[event.type] }}
                  >
                    {EVENT_ICONS[event.type]}
                  </div>
                  
                  <div className={styles.eventContent}>
                    <div className={styles.eventHeader}>
                      {event.playerImage && (
                        <img src={event.playerImage} alt={event.playerName} className={styles.playerThumb} />
                      )}
                      <div className={styles.eventMeta}>
                        <span className={styles.playerName}>{event.playerName}</span>
                        <span className={styles.position}>{event.position}</span>
                      </div>
                    </div>
                    
                    <p className={styles.eventDescription}>{event.description}</p>
                    
                    {event.type === 'commitment' && (
                      <div className={styles.transferInfo}>
                        <span>{event.fromSchool}</span>
                        <span className={styles.arrow}>→</span>
                        <span className={styles.toSchool}>{event.toSchool}</span>
                      </div>
                    )}
                    
                    {event.type === 'nil_change' && (
                      <div className={styles.nilChange}>
                        <span className={styles.oldValue}>{formatCurrency(event.oldValue)}</span>
                        <span className={styles.arrow}>→</span>
                        <span className={styles.newValue}>{formatCurrency(event.newValue)}</span>
                      </div>
                    )}
                    
                    {event.type === 'ranking_change' && (
                      <div className={styles.rankChange}>
                        <span>#{event.oldRank}</span>
                        <span className={styles.arrow}>→</span>
                        <span className={event.newRank < event.oldRank ? styles.improved : styles.dropped}>
                          #{event.newRank}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <span className={styles.timestamp}>{formatTimeAgo(event.timestamp)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

