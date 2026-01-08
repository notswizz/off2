import styles from '@/styles/Dashboard.module.css';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (currentPage < totalPages - 2) pages.push('...');
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className={styles.pagination}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={styles.pageBtn}
      >
        ←
      </button>
      
      <div className={styles.pageNumbers}>
        {getVisiblePages().map((page, idx) => (
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className={styles.pageBtn} style={{ cursor: 'default', opacity: 0.5 }}>
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`${styles.pageBtn} ${currentPage === page ? styles.activePage : ''}`}
            >
              {page}
            </button>
          )
        ))}
      </div>
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={styles.pageBtn}
      >
        →
      </button>
    </div>
  );
}
