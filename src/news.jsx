import React, { useState, useEffect } from "react";
import { Clock, User, ExternalLink, AlertCircle } from "lucide-react";
import "./index.css";
const App1 = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "https://newsapi.org/v2/everything?q=trump&pageSize=100&apiKey=1f7e109baa354ccc8af97052027e9a8f"
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === "ok") {
          setArticles(data.articles);
        } else {
          setError(data.message || "Unknown error");
        }
      } catch (error) {
        setError("Failed to fetch news articles: " + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const getTimeAgo = (dateString) => {
    const published = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - published) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return published.toLocaleDateString();
  };

  // Extract unique source categories
  const categories = [
    "all",
    ...new Set(articles.map((article) => article.source.name)),
  ].slice(0, 8);

  // Filtered articles based on active category
  const filteredArticles =
    activeCategory === "all"
      ? articles
      : articles.filter((article) => article.source.name === activeCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-64 w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-6 bg-white rounded-lg shadow-md max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <div className="text-xl font-bold text-red-500 mb-2">
            Error Loading News
          </div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-4">News Articles</h1>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  activeCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {category === "all" ? "All Sources" : category}
              </button>
            ))}
          </div>
        </header>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredArticles.map((article, index) => (
            <div
              key={index}
              className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              {/* Card Image */}
              <div className="relative h-48 bg-gray-200">
                {article.urlToImage ? (
                  <img
                    src={article.urlToImage}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/300x200?text=No+Image";
                      e.target.alt = "Image unavailable";
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-200 text-gray-500">
                    No Image Available
                  </div>
                )}
                <span className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  {article.source.name}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-4">
                <h5 className="font-bold text-lg mb-2 line-clamp-2">
                  {article.title}
                </h5>
                <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                  {article.description || "No description available."}
                </p>

                {/* Card Footer */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center text-gray-500 text-xs mb-2">
                    <Clock size={14} className="mr-1" />
                    {getTimeAgo(article.publishedAt)}
                  </div>
                  <div className="flex items-center text-gray-500 text-xs mb-3">
                    <User size={14} className="mr-1" />
                    {article.author || "Unknown Author"}
                  </div>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Read More
                    <ExternalLink size={14} className="ml-1" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Articles Found */}
        {filteredArticles.length === 0 && (
          <div className="text-center py-20">
            <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">
              No articles found for selected source. Try another category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App1;
