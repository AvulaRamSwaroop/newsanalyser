import React, { useState, useEffect } from "react";
import { Clock, User, ExternalLink, AlertCircle } from "lucide-react";

const App = () => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-72"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
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

  // Filtered articles based on active category
  const filteredArticles =
    activeCategory === "all"
      ? articles
      : articles.filter((article) => article.source.name === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-6 text-gray-800">
            Trump News Roundup
          </h1>
          <p className="text-center text-gray-600 max-w-xl mx-auto mb-8">
            Stay informed with the latest news and developments from the Trump
            administration and related political coverage.
          </p>

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
        <section className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
          {filteredArticles.map((article, index) => (
            <Card
              key={index}
              className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden"
            >
              <CardHeader
                floated={false}
                color="blue-gray"
                className="relative h-[200px] overflow-hidden"
              >
                {article.urlToImage ? (
                  <picture>
                    <source
                      srcSet={article.urlToImage}
                      media="(min-width:1024px)"
                    />
                    <source
                      srcSet={article.urlToImage}
                      media="(min-width:768px)"
                    />
                    <img
                      src={article.urlToImage}
                      alt={article.title}
                      loading="lazy"
                      className="w-full h-full object-cover object-center"
                      onError={(e) => {
                        e.target.src = "/api/placeholder/400/200";
                        e.target.alt = "Image unavailable";
                      }}
                    />
                  </picture>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-200 text-gray-500">
                    No Image Available
                  </div>
                )}
                <span className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-[2px] rounded-full text-xs font-semibold shadow-md">
                  {article.source.name}
                </span>
              </CardHeader>

              {/* Card Body */}
              <CardBody className="flex flex-col flex-grow p-4">
                <Typography
                  variant="h5"
                  color="blue-gray"
                  className="mb-2 line-clamp-2 font-semibold"
                >
                  {article.title}
                </Typography>
                <Typography
                  variant="small"
                  color="gray"
                  className="line-clamp-3 flex-grow"
                >
                  {article.description || "No description available."}
                </Typography>
              </CardBody>

              {/* Card Footer */}
              <CardFooter
                divider
                className="flex flex-col gap-y-3 pt-3 mt-auto"
              >
                <Typography
                  variant="small"
                  color="gray"
                  className="flex items-center gap-x-1 mb-[6px]"
                >
                  <Clock size={16} /> {getTimeAgo(article.publishedAt)}
                </Typography>
                <Typography
                  variant="small"
                  color="gray"
                  className="mb-auto line-clamp-1 flex items-center gap-x-[4px] mt-[4px]"
                >
                  <User size={16} /> {article.author || "Unknown Author"}
                </Typography>
                <Button
                  size="sm"
                  variant="gradient"
                  color="blue"
                  fullWidth
                  as="a"
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-[10px]"
                >
                  Read More
                  <ExternalLink size={16} strokeWidth={2.5} />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </section>

        {/* No Articles Found */}
        {!filteredArticles.length && (
          <section className="text-center py-[100px] text-gray-[500] font-medium text-lg flex flex-col items-center justify-center gap-y-[10px]">
            <AlertCircle size={64} strokeWidth={1.5} />
            No articles found for selected source. Try another category.
          </section>
        )}
      </div>
    </div>
  );
};

export default App;
