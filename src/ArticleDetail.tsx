import React from "react";
import { Clock, Globe, UserCircle, ArrowLeft } from "lucide-react";
import defaultImage from "./assets/placeholder.webp";
import Header from "./Header";

interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  source: string;
  category: string;
  author: string;
  published_at: string;
  urlToImage: string;
  url: string;
}

interface User {
  id: string;
  email: string;
  name: string;
}

interface FilterState {
  keyword: string;
  dateFrom: string;
  dateTo: string;
  category: string;
  source: string;
  author: string;
}

interface ArticleDetailProps {
  article: Article;
  onBack: () => void;
  // Header props
  isAuthenticated: boolean;
  currentUser: User | null;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  showFilterPanel: boolean;
  setShowFilterPanel: (show: boolean) => void;
  showSettingsPanel: boolean;
  setShowSettingsPanel: (show: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  setShowAuthModal: (show: boolean) => void;
  handleLogout: () => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ArticleDetail: React.FC<ArticleDetailProps> = ({
  article,
  onBack,
  isAuthenticated,
  currentUser,
  filters,
  setFilters,
  showFilterPanel,
  setShowFilterPanel,
  showSettingsPanel,
  setShowSettingsPanel,
  mobileMenuOpen,
  setMobileMenuOpen,
  setShowAuthModal,
  handleLogout,
}) => {
  if (!article) return null;

  return (
    <div className="article-detail-container">
      {/* Header */}
      <Header
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        filters={filters}
        setFilters={setFilters}
        showFilterPanel={showFilterPanel}
        setShowFilterPanel={setShowFilterPanel}
        showSettingsPanel={showSettingsPanel}
        setShowSettingsPanel={setShowSettingsPanel}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        setShowAuthModal={setShowAuthModal}
        handleLogout={handleLogout}
        showSearchAndFilters={false} // Hide search and filters on article detail page
      />

      {/* Article Detail Content */}
      <div className="article-detail">
        <div className="article-detail-header">
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={20} />
            <span>Back to News</span>
          </button>
        </div>

        <div className="detail-image-container">
          <img
            src={
              article.urlToImage && article.urlToImage.trim() !== ""
                ? article.urlToImage
                : defaultImage
            }
            alt={article.title}
            className="detail-image"
          />
          <div className="detail-category-badge">{article.category}</div>
        </div>

        <div className="detail-content">
          <h2 className="detail-title">{article.title}</h2>

          <div className="detail-meta">
            <div className="detail-meta-item">
              <UserCircle size={16} />
              <span>{article.author}</span>
            </div>
            <div className="detail-meta-item">
              <Globe size={16} />
              <span>{article.source}</span>
            </div>
            <div className="detail-meta-item">
              <Clock size={16} />
              <span>{formatDate(article.published_at)}</span>
            </div>
          </div>

          <p className="detail-description">{article.description}</p>

          <div className="detail-full-content">
            <div className="content-text">{article.content}</div>
          </div>

          <div className="detail-actions">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="detail-read-original"
            >
              Read Original Article
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;
