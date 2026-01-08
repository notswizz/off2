import { useState, useEffect, useRef } from 'react';
import styles from '@/styles/Comments.module.css';
import { trackUserAction } from '@/hooks/useActionTracker';

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function MessageItem({ msg, isSetup, onReply, onVote, isReply = false }) {
  const score = (msg.upvotes || 0) - (msg.downvotes || 0);
  
  return (
    <div className={`${styles.message} ${isReply ? styles.replyMessage : ''}`}>
      <div className={styles.messageBubble}>
        <div className={styles.messageHeader}>
          {msg.collegeLogo && <img src={msg.collegeLogo} alt="" className={styles.msgLogo} />}
          <span className={styles.msgUser}>{msg.userId}</span>
          <span className={styles.msgSchool}>{msg.college}</span>
          <span className={styles.msgTime}>{timeAgo(msg.createdAt)}</span>
        </div>
        {msg.replyToUser && (
          <span className={styles.replyTag}>↳ @{msg.replyToUser}</span>
        )}
        <p className={styles.msgText}>{msg.message}</p>
        
        {/* Actions */}
        <div className={styles.msgActions}>
          <div className={styles.msgVotes}>
            <button 
              className={styles.voteBtn} 
              onClick={() => onVote(msg.id, 'up')}
              disabled={!isSetup}
            >
              ▲
            </button>
            <span className={`${styles.voteCount} ${score > 0 ? styles.positive : score < 0 ? styles.negative : ''}`}>
              {score}
            </span>
            <button 
              className={styles.voteBtn} 
              onClick={() => onVote(msg.id, 'down')}
              disabled={!isSetup}
            >
              ▼
            </button>
          </div>
          {isSetup && !isReply && (
            <button className={styles.replyBtn} onClick={() => onReply(msg)}>
              Reply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ThreadItem({ thread, isSetup, onReply, onVote }) {
  const [expanded, setExpanded] = useState(false);
  const replyCount = thread.replies?.length || 0;
  const threadScore = (thread.upvotes || 0) - (thread.downvotes || 0);
  
  return (
    <div className={styles.thread}>
      <MessageItem 
        msg={thread} 
        isSetup={isSetup} 
        onReply={onReply}
        onVote={onVote}
      />
      {replyCount > 0 && (
        <>
          <button 
            className={styles.expandBtn}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '▼' : '▶'} {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
          </button>
          {expanded && (
            <div className={styles.threadReplies}>
              {thread.replies.map(reply => (
                <MessageItem 
                  key={reply.id}
                  msg={reply} 
                  isSetup={isSetup} 
                  onReply={onReply}
                  onVote={onVote}
                  isReply={true}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Comments({ playerId, playerName }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [sortBy, setSortBy] = useState('top'); // 'top', 'newest', 'oldest'
  
  const [schools, setSchools] = useState([]);
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // Load saved user from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('off2_chat_user');
      if (savedUser) {
        const { userId: savedId, school } = JSON.parse(savedUser);
        if (savedId) setUserId(savedId);
        if (school) {
          setSelectedSchool(school);
          setSearchTerm(school.name);
        }
      }
    } catch (err) {
      console.error('Error loading saved user:', err);
    }
  }, []);

  // Save user to localStorage when changed
  useEffect(() => {
    if (userId && selectedSchool) {
      try {
        localStorage.setItem('off2_chat_user', JSON.stringify({
          userId,
          school: selectedSchool
        }));
      } catch (err) {
        console.error('Error saving user:', err);
      }
    }
  }, [userId, selectedSchool]);

  useEffect(() => {
    async function fetchSchools() {
      try {
        const res = await fetch('/api/schools');
        if (res.ok) {
          const data = await res.json();
          setSchools(data.schools || []);
        }
      } catch (err) {
        console.error('Error fetching schools:', err);
      }
    }
    fetchSchools();
  }, []);

  useEffect(() => {
    if (playerId) fetchComments();
  }, [playerId]);

  useEffect(() => {
    if (searchTerm.length > 0 && schools.length > 0 && !selectedSchool) {
      const filtered = schools.filter(s => 
        s.name?.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 6);
      setFilteredSchools(filtered);
      setShowDropdown(filtered.length > 0);
      setSelectedIndex(-1);
    } else {
      setFilteredSchools([]);
      setShowDropdown(false);
    }
  }, [searchTerm, schools, selectedSchool]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchComments() {
    try {
      const res = await fetch(`/api/comments?playerId=${playerId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchChange(e) {
    setSearchTerm(e.target.value);
    if (selectedSchool) setSelectedSchool(null);
  }

  function handleCollegeKeyDown(e) {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredSchools.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      selectSchool(filteredSchools[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  }

  function selectSchool(school) {
    setSelectedSchool(school);
    setSearchTerm(school.name);
    setShowDropdown(false);
    setSelectedIndex(-1);
  }

  function clearSchool() {
    setSelectedSchool(null);
    setSearchTerm('');
    inputRef.current?.focus();
  }

  function clearSavedUser() {
    localStorage.removeItem('off2_chat_user');
    setUserId('');
    setSelectedSchool(null);
    setSearchTerm('');
  }

  function startReply(comment) {
    setReplyingTo(comment);
    chatInputRef.current?.focus();
  }

  async function handleVote(commentId, voteType) {
    try {
      const res = await fetch('/api/comment-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, voteType })
      });
      
      if (res.ok) {
        const data = await res.json();
        setComments(prev => prev.map(c => 
          c.id === commentId 
            ? { ...c, upvotes: data.upvotes, downvotes: data.downvotes }
            : c
        ));
        
        // Track the vote action
        const comment = comments.find(c => c.id === commentId);
        trackUserAction(
          voteType === 'up' ? 'upvote' : 'downvote',
          'comment',
          commentId,
          comment?.userId || 'unknown',
          { playerId, playerName, commentMessage: comment?.message?.substring(0, 50) }
        );
      }
    } catch (err) {
      console.error('Error voting:', err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId.trim() || !selectedSchool || !message.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          playerName,
          userId: userId.trim(),
          college: selectedSchool.name,
          collegeLogo: selectedSchool.logo,
          message: message.trim(),
          parentId: replyingTo?.id || null,
          replyToUser: replyingTo?.userId || null
        })
      });

      if (res.ok) {
        const newComment = await res.json();
        setComments([...comments, newComment]);
        
        // Track the comment/reply action
        trackUserAction(
          replyingTo ? 'reply' : 'comment',
          'player',
          playerId,
          playerName,
          { 
            commentId: newComment.id, 
            message: message.trim().substring(0, 100),
            replyTo: replyingTo?.userId || null
          }
        );
        
        setMessage('');
        setReplyingTo(null);
      }
    } catch (err) {
      console.error('Error posting:', err);
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  }

  const isSetup = userId.trim() && selectedSchool;

  // Organize into threads
  const parentComments = comments.filter(c => !c.parentId);
  const replies = comments.filter(c => c.parentId);
  
  let threads = parentComments.map(parent => ({
    ...parent,
    replies: replies.filter(r => r.parentId === parent.id)
  }));

  // Sort threads
  if (sortBy === 'top') {
    threads.sort((a, b) => {
      const scoreA = (a.upvotes || 0) - (a.downvotes || 0);
      const scoreB = (b.upvotes || 0) - (b.downvotes || 0);
      return scoreB - scoreA;
    });
  } else if (sortBy === 'newest') {
    threads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortBy === 'oldest') {
    threads.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  return (
    <div className={styles.chatContainer}>
      {/* Header */}
      <div className={styles.chatHeader}>
        <div className={styles.headerLeft}>
          <span className={styles.chatTitle}>Chat</span>
          <span className={styles.chatCount}>{comments.length}</span>
        </div>
        <div className={styles.sortButtons}>
          <button 
            className={`${styles.sortBtn} ${sortBy === 'top' ? styles.active : ''}`}
            onClick={() => setSortBy('top')}
          >
            Top
          </button>
          <button 
            className={`${styles.sortBtn} ${sortBy === 'newest' ? styles.active : ''}`}
            onClick={() => setSortBy('newest')}
          >
            New
          </button>
          <button 
            className={`${styles.sortBtn} ${sortBy === 'oldest' ? styles.active : ''}`}
            onClick={() => setSortBy('oldest')}
          >
            Old
          </button>
        </div>
      </div>

      {/* Setup Section */}
      {!isSetup && (
        <div className={styles.setupSection}>
          <p className={styles.setupText}>Set up to chat</p>
          <input
            type="text"
            placeholder="Your username"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className={styles.setupInput}
            maxLength={30}
          />
          <div className={styles.collegeWrapper}>
            {selectedSchool ? (
              <div className={styles.selectedSchool}>
                {selectedSchool.logo && (
                  <img src={selectedSchool.logo} alt="" className={styles.selectedLogo} />
                )}
                <span className={styles.selectedName}>{selectedSchool.name}</span>
                <button type="button" className={styles.clearBtn} onClick={clearSchool}>×</button>
              </div>
            ) : (
              <>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Your school"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={handleCollegeKeyDown}
                  onFocus={() => searchTerm.length > 0 && filteredSchools.length > 0 && setShowDropdown(true)}
                  className={styles.setupInput}
                  autoComplete="off"
                />
                {showDropdown && (
                  <div ref={dropdownRef} className={styles.dropdown}>
                    {filteredSchools.map((school, idx) => (
                      <div
                        key={school.key}
                        className={`${styles.dropdownItem} ${idx === selectedIndex ? styles.selected : ''}`}
                        onClick={() => selectSchool(school)}
                      >
                        {school.logo && <img src={school.logo} alt="" className={styles.dropdownLogo} />}
                        <span>{school.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className={styles.messagesArea}>
        {loading ? (
          <div className={styles.loadingState}>Loading chat...</div>
        ) : threads.length === 0 ? (
          <div className={styles.emptyState}>No messages yet. Start the conversation!</div>
        ) : (
          threads.map((thread) => (
            <ThreadItem
              key={thread.id}
              thread={thread}
              isSetup={isSetup}
              onReply={startReply}
              onVote={handleVote}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {isSetup && (
        <div className={styles.inputArea}>
          <div className={styles.userBadge}>
            {selectedSchool?.logo && <img src={selectedSchool.logo} alt="" className={styles.userBadgeLogo} />}
            <span className={styles.userBadgeName}>{userId}</span>
            <button className={styles.userBadgeEdit} onClick={clearSavedUser} title="Change user">✎</button>
          </div>
          {replyingTo && (
            <div className={styles.replyingTo}>
              <span>↳ Replying to <strong>{replyingTo.userId}</strong></span>
              <button onClick={() => setReplyingTo(null)}>×</button>
            </div>
          )}
          <div className={styles.inputRow}>
            <input
              ref={chatInputRef}
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className={styles.chatInput}
              maxLength={500}
            />
            <button 
              className={styles.sendBtn}
              onClick={handleSubmit}
              disabled={submitting || !message.trim()}
            >
              {submitting ? '...' : '→'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
