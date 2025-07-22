import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import {
  Filter,
  Settings,
  Globe,
  UserCircle,
  BookOpen,
  Clock,
  Search,
} from "lucide-react";
import api, { setAuthToken } from "./services/api";
import "./App.css";
import defaultImage from "./assets/placeholder.webp";
import ArticleDetail from "./ArticleDetail";
import Header from "./Header";
import Preferences from "./Preference";

// TypeScript interfaces
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
  api_source: string;
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

const NewsAggregator: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    keyword: "",
    dateFrom: "",
    dateTo: "",
    category: "",
    source: "",
    author: "",
  });

  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  });

  // --- Add this state for user preferences ---
  const [userPrefs, setUserPrefs] = useState({
    use_newsapi: true,
    use_gnews: true,
    use_mediastack: true,
  });

  const Spinner: React.FC = () => (
    <div className="spinner-loader">
      <div className="spinner" />
    </div>
  );

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      setLoading(true); // Start loading
      api
        .get("/news", { params: { user_id: currentUser.id } })
        .then((response) => {
          setArticles(response.data.data || response.data);
          setFilteredArticles(response.data.data || response.data);
        })
        .catch((error) => {
          console.error("Error fetching articles:", error);
        })
        .finally(() => {
          setLoading(false); // End loading
        });

      // --- Fetch user preferences when authenticated ---
            api.get("/preferences", { params: { user_id: currentUser.id } }).then((res) => {
        setUserPrefs(res.data);
      });
    }
  }, [isAuthenticated]);

  // Filter articles based on current filters
  useEffect(() => {
    let filtered = articles;

    if (filters.keyword) {
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(filters.keyword.toLowerCase()) ||
          article.description
            .toLowerCase()
            .includes(filters.keyword.toLowerCase())
      );
    }

    if (filters.category && filters.category !== "All") {
      filtered = filtered.filter(
        (article) => article.category === filters.category
      );
    }

    if (filters.source && filters.source !== "All") {
      filtered = filtered.filter(
        (article) => article.source === filters.source
      );
    }

    if (filters.author) {
      filtered = filtered.filter((article) =>
        article.author.toLowerCase().includes(filters.author.toLowerCase())
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(
        (article) =>
          new Date(article.published_at) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(
        (article) => new Date(article.published_at) <= new Date(filters.dateTo)
      );
    }

    setFilteredArticles(filtered);
  }, [filters, articles, isAuthenticated, currentUser]);

  // --- Filter articles by enabled sources ---
  const filteredArticlesByPrefs = React.useMemo(() => {
    return filteredArticles.filter((article) => {
      if (userPrefs.use_newsapi && article.api_source === "NewsAPI")
        return true;
      if (userPrefs.use_gnews && article.api_source === "GNews") return true;
      if (userPrefs.use_mediastack && article.api_source === "MediaStack")
        return true;
      return false;
    });
  }, [filteredArticles, userPrefs]);

  const [formErrors, setFormErrors] = useState<{ [key: string]: string[] }>({});

  const handleAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormErrors({}); // Clear previous errors

    try {
      let res;
      if (isLogin) {
        res = await api.post("/login", {
          email: authForm.email,
          password: authForm.password,
        });
      } else {
        if (authForm.password !== authForm.confirmPassword) {
          setFormErrors({ confirmPassword: ["Passwords do not match"] });
          return;
        }
        res = await api.post("/register", {
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
        });
      }
      setAuthToken(res.data.token);
      localStorage.setItem("auth_token", res.data.token);
      setIsAuthenticated(true);
      setCurrentUser(res.data.user);
      setShowAuthModal(false);
      setAuthForm({ email: "", password: "", name: "", confirmPassword: "" });
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        alert(err.response?.data?.message || "Authentication failed");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/logout");
      setAuthToken(null);
      localStorage.removeItem("auth_token");
      setIsAuthenticated(false);
      setCurrentUser(null);
      setFilters({
        keyword: "",
        dateFrom: "",
        dateTo: "",
        category: "",
        source: "",
        author: "",
      });
      setShowAuthModal(true);
    } catch (err) {
      alert("Logout failed");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setShowAuthModal(true);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      setAuthToken(token);
      api
        .get("/user")
        .then((res) => {
          setIsAuthenticated(true);
          setCurrentUser(res.data);
        })
        .catch(() => {
          setAuthToken(null);
          setIsAuthenticated(false);
          setCurrentUser(null);
          setShowAuthModal(true); // Show modal if token is invalid
        });
    }
  }, []);

  useEffect(() => {
    if (!showFilterDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (
        !(e.target as HTMLElement).closest(".dropdown-menu") &&
        !(e.target as HTMLElement).closest(".filter-btn")
      ) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showFilterDropdown]);

  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchArticles = async () => {
    setLoading(true);
    const res = await api.get("/news", { params: { offset, limit } });
    const newArticles = res.data.data || res.data; // adjust if your API returns {data: [...]}
    setArticles((prev) => [...prev, ...newArticles]);
    setHasMore(newArticles.length === limit);
    setOffset(offset + limit);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchArticles();
    }
  }, [isAuthenticated]);

  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 100 &&
      hasMore &&
      !loading
    ) {
      fetchArticles();
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loading, offset]);

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

  const uniqueArticles = React.useMemo(() => {
    const seen = new Set();
    return filteredArticlesByPrefs.filter((article) => {
      if (seen.has(article.url)) return false;
      seen.add(article.url);
      return true;
    });
  }, [filteredArticlesByPrefs]);

  const uniqueCategories = React.useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => a.category && set.add(a.category));
    return ["All", ...Array.from(set)];
  }, [articles]);

  const uniqueSources = React.useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => a.source && set.add(a.source));
    return ["All", ...Array.from(set)];
  }, [articles]);

  const uniqueAuthors = React.useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => a.author && set.add(a.author));
    return Array.from(set);
  }, [articles]);

  return (
    <div className="news-app">
      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-header-content">
                <h1 className="logo" style={{ textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BookOpen size={28} />
                  <span >NewsHub</span>
                </h1>
                <h2 className="modal-title">{isLogin ? "Login" : "Sign Up"}</h2>
                
              </div>

              <div className="modal-form">
                {!isLogin && (
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      required
                      value={authForm.name}
                      onChange={(e) =>
                        setAuthForm({ ...authForm, name: e.target.value })
                      }
                      className="form-input"
                    />
                    {formErrors.name && (
                      <div className="form-error">{formErrors.name[0]}</div>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    required
                    value={authForm.email}
                    onChange={(e) =>
                      setAuthForm({ ...authForm, email: e.target.value })
                    }
                    className="form-input"
                  />
                  {formErrors.email && (
                    <div className="form-error">{formErrors.email[0]}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    required
                    value={authForm.password}
                    onChange={(e) =>
                      setAuthForm({ ...authForm, password: e.target.value })
                    }
                    className="form-input"
                  />
                  {formErrors.password && (
                    <div className="form-error">{formErrors.password[0]}</div>
                  )}
                </div>

                {!isLogin && (
                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={authForm.confirmPassword}
                      onChange={(e) =>
                        setAuthForm({
                          ...authForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="form-input"
                    />
                    {formErrors.confirmPassword && (
                      <div className="form-error">
                        {formErrors.confirmPassword[0]}
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleAuth}>
                  <button type="submit" className="form-submit-btn">
                    {isLogin ? "Login" : "Sign Up"}
                  </button>
                </form>
              </div>

              <div className="modal-footer">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="modal-switch-btn"
                >
                  {isLogin
                    ? "Need an account? Sign up"
                    : "Already have an account? Login"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAuthenticated &&
        !showAuthModal &&
        (selectedArticle ? (
          <ArticleDetail
            article={selectedArticle}
            onBack={() => setSelectedArticle(null)}
            // Pass header props to ArticleDetail
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
          />
        ) : (
          <>
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
            />

            {/* Mobile menu */}
            {mobileMenuOpen && (
              <div className="mobile-menu">
                <div className="mobile-menu-content">
                  <button
                    onClick={() => setShowFilterPanel(!showFilterPanel)}
                    className="mobile-menu-item"
                  >
                    <Filter size={20} />
                    <span>Filter Articles</span>
                  </button>
                  {isAuthenticated && (
                    <button
                      onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                      className="mobile-menu-item"
                    >
                      <Settings size={20} />
                      <span>Preferences</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Filter Panel */}
            {showFilterPanel && (
              <div className="filter-panel">
                <div className="filter-content">
                  <div className="filter-grid">
                    <div className="filter-group">
                      <label className="filter-label">Category</label>
                      <select
                        value={filters.category}
                        onChange={(e) =>
                          setFilters({ ...filters, category: e.target.value })
                        }
                        className="filter-select"
                      >
                        {uniqueCategories.map((cat) => (
                          <option key={cat} value={cat === "All" ? "" : cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="filter-group">
                      <label className="filter-label">Source</label>
                      <select
                        value={filters.source}
                        onChange={(e) =>
                          setFilters({ ...filters, source: e.target.value })
                        }
                        className="filter-select"
                      >
                        {uniqueSources.map((source) => (
                          <option
                            key={source}
                            value={source === "All" ? "" : source}
                          >
                            {source}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="filter-group">
                      <label className="filter-label">Author</label>
                      <input
                        type="text"
                        placeholder="Search author..."
                        value={filters.author}
                        onChange={(e) =>
                          setFilters({ ...filters, author: e.target.value })
                        }
                        className="filter-input"
                        list="author-list"
                      />
                      <datalist id="author-list">
                        {uniqueAuthors.map((author) => (
                          <option key={author} value={author} />
                        ))}
                      </datalist>
                    </div>

                    <div className="filter-group">
                      <label className="filter-label">Clear</label>
                      <button
                        onClick={() =>
                          setFilters({
                            keyword: "",
                            dateFrom: "",
                            dateTo: "",
                            category: "",
                            source: "",
                            author: "",
                          })
                        }
                        className="clear-filters-btn"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Routes>
              <Route
                path="/"
                element={
                  // Your main news feed content (existing JSX)
                  <>
                    {/* Main Content */}
                    <main className="main-content">
                      {/* Mobile search and filter (visible only on mobile) */}
                      <div
                        className="mobile-search-filter"
                        style={{
                          marginBottom: "1rem",
                          display: "flex",
                          gap: "0.5rem",
                          position: "relative",
                        }}
                      >
                        <div className="search-container" style={{ flex: 1 }}>
                          <Search className="search-icon" size={20} />
                          <input
                            type="text"
                            placeholder="Search articles..."
                            className="search-input"
                            value={filters.keyword}
                            onChange={(e) =>
                              setFilters({
                                ...filters,
                                keyword: e.target.value,
                              })
                            }
                            style={{ minWidth: 0, width: "100%" }}
                          />
                        </div>
                        <button
                          className="filter-btn"
                          onClick={() => setShowFilterDropdown((v) => !v)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Filter size={20} />
                          <span>Filter</span>
                        </button>
                        {showFilterDropdown && (
                          <div
                            className="dropdown-menu"
                            style={{
                              position: "absolute",
                              right: 0,
                              top: "calc(100% + 8px)",
                              background: "#fff",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                              borderRadius: "0.5rem",
                              minWidth: 220,
                              zIndex: 10,
                              padding: "1rem",
                            }}
                          >
                            {/* Filter form (same as your desktop filter dropdown) */}
                            <div className="filter-group">
                              <label className="filter-label">Category</label>
                              <select
                                value={filters.category}
                                onChange={(e) =>
                                  setFilters({
                                    ...filters,
                                    category: e.target.value,
                                  })
                                }
                                className="filter-select"
                              >
                                {uniqueCategories.map((cat) => (
                                  <option
                                    key={cat}
                                    value={cat === "All" ? "" : cat}
                                  >
                                    {cat}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="filter-group">
                              <label className="filter-label">Source</label>
                              <select
                                value={filters.source}
                                onChange={(e) =>
                                  setFilters({
                                    ...filters,
                                    source: e.target.value,
                                  })
                                }
                                className="filter-select"
                              >
                                {uniqueSources.map((source) => (
                                  <option
                                    key={source}
                                    value={source === "All" ? "" : source}
                                  >
                                    {source}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="filter-group">
                              <label className="filter-label">Author</label>
                              <input
                                type="text"
                                placeholder="Search author..."
                                value={filters.author}
                                onChange={(e) =>
                                  setFilters({
                                    ...filters,
                                    author: e.target.value,
                                  })
                                }
                                className="filter-input"
                                list="author-list"
                              />
                              <datalist id="author-list">
                                {uniqueAuthors.map((author) => (
                                  <option key={author} value={author} />
                                ))}
                              </datalist>
                            </div>
                            <div className="filter-group">
                              <button
                                onClick={() => {
                                  setFilters({
                                    keyword: "",
                                    dateFrom: "",
                                    dateTo: "",
                                    category: "",
                                    source: "",
                                    author: "",
                                  });
                                  setShowFilterDropdown(false);
                                }}
                                className="clear-filters-btn"
                                style={{ marginTop: "0.5rem" }}
                              >
                                Clear Filters
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Results info */}
                      <div
                        className="content-header"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "1rem",
                        }}
                      >
                        <div>
                          <h2
                            className="content-title"
                            style={{
                              display: "inline-block",
                              marginRight: "1rem",
                            }}
                          >
                            {isAuthenticated
                              ? "Your Personalized News Feed"
                              : "Latest News"}
                          </h2>
                          <span className="content-subtitle">
                            Showing {uniqueArticles.length} articles
                            {filters.keyword && ` for "${filters.keyword}"`}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            position: "relative",
                          }}
                          className="filter-newss"
                        >
                          {/* Search bar */}
                          <div
                            className="search-container"
                            style={{ marginRight: "0.5rem" }}
                          >
                            <Search className="search-icon" size={20} />
                            <input
                              type="text"
                              placeholder="Search articles..."
                              className="search-input"
                              value={filters.keyword}
                              onChange={(e) =>
                                setFilters({
                                  ...filters,
                                  keyword: e.target.value,
                                })
                              }
                              style={{ minWidth: 180 }}
                            />
                          </div>
                          {/* Filter button and dropdown */}
                          <button
                            className="filter-btn"
                            onClick={() => setShowFilterDropdown((v) => !v)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.25rem",
                            }}
                          >
                            <Filter size={20} />
                            <span>Filter</span>
                          </button>
                          {showFilterDropdown && (
                            <div
                              className="dropdown-menu"
                              style={{
                                position: "absolute",
                                right: 0,
                                top: "calc(100% + 8px)",
                                background: "#fff",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                                borderRadius: "0.5rem",
                                minWidth: 220,
                                zIndex: 10,
                                padding: "1rem",
                              }}
                            >
                              {/* Filter form */}
                              <div className="filter-group">
                                <label className="filter-label">Category</label>
                                <select
                                  value={filters.category}
                                  onChange={(e) =>
                                    setFilters({
                                      ...filters,
                                      category: e.target.value,
                                    })
                                  }
                                  className="filter-select"
                                >
                                  {uniqueCategories.map((cat) => (
                                    <option
                                      key={cat}
                                      value={cat === "All" ? "" : cat}
                                    >
                                      {cat}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="filter-group">
                                <label className="filter-label">Source</label>
                                <select
                                  value={filters.source}
                                  onChange={(e) =>
                                    setFilters({
                                      ...filters,
                                      source: e.target.value,
                                    })
                                  }
                                  className="filter-select"
                                >
                                  {uniqueSources.map((source) => (
                                    <option
                                      key={source}
                                      value={source === "All" ? "" : source}
                                    >
                                      {source}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="filter-group">
                                <label className="filter-label">Author</label>
                                <input
                                  type="text"
                                  placeholder="Search author..."
                                  value={filters.author}
                                  onChange={(e) =>
                                    setFilters({
                                      ...filters,
                                      author: e.target.value,
                                    })
                                  }
                                  className="filter-input"
                                  list="author-list"
                                />
                                <datalist id="author-list">
                                  {uniqueAuthors.map((author) => (
                                    <option key={author} value={author} />
                                  ))}
                                </datalist>
                              </div>
                              <div className="filter-group">
                                <button
                                  onClick={() => {
                                    setFilters({
                                      keyword: "",
                                      dateFrom: "",
                                      dateTo: "",
                                      category: "",
                                      source: "",
                                      author: "",
                                    });
                                    setShowFilterDropdown(false);
                                  }}
                                  className="clear-filters-btn"
                                  style={{ marginTop: "0.5rem" }}
                                >
                                  Clear Filters
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Articles Grid */}
                      <div className="articles-grid">
                        {uniqueArticles.map((article) => (
                          <article key={article.url} className="article-card">
                            <div className="article-image-container">
                              <img
                                src={
                                  article.urlToImage &&
                                  article.urlToImage.trim() !== ""
                                    ? article.urlToImage
                                    : defaultImage
                                }
                                alt={article.title}
                                className="article-image"
                              />
                              <div className="article-category-badge">
                                {article.category}
                              </div>
                            </div>

                            <div className="article-content">
                              <h3 className="article-title">{article.title}</h3>
                              <p className="article-description">
                                {article.description}
                              </p>
                              <div className="article-meta">
                                <div className="article-meta-item">
                                  <UserCircle size={14} />
                                  <span>{article.author}</span>
                                </div>
                                <div className="article-meta-item">
                                  <Globe size={14} />
                                  <span>{article.source}</span>
                                </div>
                              </div>
                              <div className="article-date">
                                <Clock size={14} />
                                <span>{formatDate(article.published_at)}</span>
                              </div>
                              <div className="article-actions">
                                <button
                                  className="read-more-btn"
                                  onClick={() => setSelectedArticle(article)}
                                >
                                  Read More
                                </button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>

                      {uniqueArticles.length === 0 && (
                        <div className="no-results">
                          <div className="no-results-icon">
                            <Search size={48} />
                          </div>
                          <h3 className="no-results-title">
                            No articles found
                          </h3>
                          <p className="no-results-text">
                            Try adjusting your search terms or filters
                          </p>
                        </div>
                      )}
                      {loading && articles.length > 0 && <Spinner />}
                    </main>
                  </>
                }
              />
              <Route path="/preferences" element={<Preferences />} />
            </Routes>
          </>
        ))}
    </div>
  );
};

export default NewsAggregator;
