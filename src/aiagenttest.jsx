import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  User,
  ExternalLink,
  AlertCircle,
  Filter,
  BarChart2,
  Check,
  MessageSquare,
  X,
  AlertTriangle,
} from "lucide-react";
import { Groq } from "groq-sdk";
import "./index.css";

const TrumpNewsAIAgent = ({ onArticleSelection }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [analysisMode, setAnalysisMode] = useState("neutral");
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [factCheckedClaims, setFactCheckedClaims] = useState([]);
  const groqClient = useRef(null);
  const [sortOrder, setSortOrder] = useState("latest");
  
  const toggleArticleSelection = (article) => {
    let newSelectedArticles;
    if (selectedArticles.some((a) => a.url === article.url)) {
      newSelectedArticles = selectedArticles.filter(
        (a) => a.url !== article.url
      );
    } else {
      newSelectedArticles = [...selectedArticles, article];
    }
    setSelectedArticles(newSelectedArticles);

    if (onArticleSelection) {
      onArticleSelection(newSelectedArticles);
    }
  };


  // Initialize Groq client
  useEffect(() => {
    groqClient.current = new Groq({
      apiKey: import.meta.env.VITE_REACT_APP_GROQ_API_KEY,
      dangerouslyAllowBrowser: true, 
    });
  }, []);
  const sortArticles = (articles, order) => {
    return [...articles].sort((a, b) => {
      const dateA = new Date(a.publishedAt);
      const dateB = new Date(b.publishedAt);
      return order === "latest" ? dateB - dateA : dateA - dateB;
    });
  };
  // Filtered articles based on active category and sort order
  const filteredArticles = sortArticles(
    activeCategory === "all"
      ? articles
      : articles.filter((article) => article.source.name === activeCategory),
    sortOrder
  );
  // Fetch news articles
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          import.meta.env.VITE_REACT_APP_NEWS_API_URL
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

  const analyzeArticles = async () => {
    if (selectedArticles.length === 0) {
      alert("Please select at least one article to analyze");
      return;
    }

    setIsAnalyzing(true);
    setAiAnalysis("");

    try {
      const articlesData = selectedArticles.map((article) => ({
        title: article.title,
        source: article.source.name,
        description: article.description,
        content: article.content,
        publishedAt: article.publishedAt,
        url: article.url,
      }));

      // Create different prompts based on the analysis mode
      let systemPrompt = "";
      switch (analysisMode) {
        case "satirical":
          systemPrompt =
            "You are a satirical political commentator analyzing Trump-related news. Use humor and wit while still conveying the key information.";
          break;
        case "factCheck":
          systemPrompt =
            "You are a fact-checking expert. Analyze the Trump-related news articles, identify claims made about Trump, and verify their accuracy against known facts.";
          break;
        case "biasAnalysis":
          systemPrompt =
            "You are a media bias analyst. Examine these Trump-related news articles and identify potential biases, framing techniques, and how different sources cover the same events.";
          break;
        default:
          systemPrompt =
            "You are a neutral political analyst. Provide a balanced, objective summary and analysis of these Trump-related news articles.";
      }


      const chatCompletion = await groqClient.current.chat.completions.create({
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Analyze the following Trump-related news articles and provide insights according to your role. Here are the articles: ${JSON.stringify(
              articlesData
            )}`,
          },
        ],
        model: "llama3-70b-8192", 
        temperature: 0.7,
        max_tokens: 2048,
      });

      // Set the AI analysis
      setAiAnalysis(chatCompletion.choices[0].message.content);

      // If in fact-check mode, extract claims
      if (analysisMode === "factCheck") {
        const claimsAnalysis = await groqClient.current.chat.completions.create(
          {
            messages: [
              {
                role: "system",
                content:
                  "Extract the key claims and their fact-check status from the analysis. Format as JSON array with 'claim' and 'status' (true/false/unverified) properties.",
              },
              {
                role: "user",
                content: chatCompletion.choices[0].message.content,
              },
            ],
            model: "llama3-8b-8192",
            temperature: 0.2,
            response_format: { type: "json_object" },
          }
        );

        try {
          const claimsData = JSON.parse(
            claimsAnalysis.choices[0].message.content
          );
          setFactCheckedClaims(claimsData.claims || []);
        } catch (e) {
          console.error("Failed to parse claims data:", e);
          setFactCheckedClaims([]);
        }
      }
    } catch (error) {
      console.error("AI analysis error:", error);
      setAiAnalysis("Error performing analysis. Please try again later.");
    } finally {
      setIsAnalyzing(false);
    }
  };

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


 
  const categories = [
    "all",
    ...new Set(articles.map((article) => article.source.name)),
  ].slice(0, 8);

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
          <h1 className="text-3xl font-bold text-center mb-4">
            Trump News AI Analyzer
          </h1>

          {/* Analysis Mode Selector */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <button
              onClick={() => setAnalysisMode("neutral")}
              className={`px-4 py-2 rounded-full text-sm transition flex items-center ${
                analysisMode === "neutral"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              <MessageSquare size={14} className="mr-1" />
              Neutral Analysis
            </button>
            <button
              onClick={() => setAnalysisMode("satirical")}
              className={`px-4 py-2 rounded-full text-sm transition flex items-center ${
                analysisMode === "satirical"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              <MessageSquare size={14} className="mr-1" />
              Satirical Take
            </button>
            <button
              onClick={() => setAnalysisMode("factCheck")}
              className={`px-4 py-2 rounded-full text-sm transition flex items-center ${
                analysisMode === "factCheck"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              <Check size={14} className="mr-1" />
              Fact Checking
            </button>

            <button
              onClick={() => setAnalysisMode("biasAnalysis")}
              className={`px-4 py-2 rounded-full text-sm transition flex items-center ${
                analysisMode === "biasAnalysis"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              <BarChart2 size={14} className="mr-1" />
              Media Bias Analysis
            </button>
          </div>

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
          <div className="flex justify-center mt-4">
            <button
              onClick={() =>
                setSortOrder(sortOrder === "latest" ? "oldest" : "latest")
              }
              className="px-4 py-4 my-4  rounded-full text-sm transition flex items-center bg-gray-200 hover:bg-gray-300"
            >
              <Clock size={14} className="mr-1" />
              Sort by:{" "}
              {sortOrder === "latest" ? "Latest First" : "Oldest First"}
            </button>
          </div>
          {/* Analysis Action Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={analyzeArticles}
              disabled={selectedArticles.length === 0 || isAnalyzing}
              className={`px-6 py-3 rounded-md text-white font-medium flex items-center ${
                selectedArticles.length === 0 || isAnalyzing
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Filter size={16} className="mr-2" />
                  Analyze Selected Articles ({selectedArticles.length})
                </>
              )}
            </button>
            <button
              onClick={() => {
                setSelectedArticles([]);
                if (onArticleSelection) {
                  onArticleSelection([]);
                }
              }}
              className="ml-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center"
            >
              <X size={16} className="mr-1" />
              Deselect All
            </button>
          </div>
        </header>
        {/* AI Analysis Results */}
        {aiAnalysis && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">
              {analysisMode === "neutral" && "Neutral Analysis"}
              {analysisMode === "satirical" && "Satirical Commentary"}
              {analysisMode === "factCheck" && "Fact Check Results"}
              {analysisMode === "biasAnalysis" && "Media Bias Analysis"}
            </h2>
            <div className="prose max-w-none">
              {aiAnalysis
                .split("\n")
                .map((paragraph, idx) =>
                  paragraph ? <p key={idx}>{paragraph}</p> : <br key={idx} />
                )}
            </div>

            {/* Fact Check Claims Display */}
            {analysisMode === "factCheck" && factCheckedClaims.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-bold text-lg mb-3">Key Claims</h3>
                <div className="space-y-3">
                  {factCheckedClaims.map((claim, idx) => (
                    <div key={idx} className="flex items-start">
                      <div
                        className={`flex-shrink-0 rounded-full p-1 mt-0.5 mr-2 ${
                          claim.status === true
                            ? "bg-green-100"
                            : claim.status === false
                            ? "bg-red-100"
                            : "bg-yellow-100"
                        }`}
                      >
                        <Check
                          size={14}
                          className={
                            claim.status === true
                              ? "text-green-600"
                              : claim.status === false
                              ? "text-red-600"
                              : "text-yellow-600"
                          }
                        />
                      </div>
                      <div>
                        <p className="text-sm">{claim.claim}</p>
                        <p
                          className={`text-xs font-medium ${
                            claim.status === true
                              ? "text-green-600"
                              : claim.status === false
                              ? "text-red-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {claim.status === true
                            ? "Verified"
                            : claim.status === false
                            ? "False"
                            : "Unverified"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Articles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredArticles.map((article, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 ${
                selectedArticles.some((a) => a.url === article.url)
                  ? "ring-2 ring-blue-500"
                  : ""
              }`}
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

                {/* Selection Checkbox */}
                <button
                  onClick={() => toggleArticleSelection(article)}
                  className={`absolute top-2 left-2 p-1 rounded-full ${
                    selectedArticles.some((a) => a.url === article.url)
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700"
                  }`}
                >
                  <Check size={16} />
                </button>
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
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleArticleSelection(article)}
                      className={`flex-1 inline-flex items-center justify-center px-3 py-2 rounded-md transition-colors ${
                        selectedArticles.some((a) => a.url === article.url)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      }`}
                    >
                      {selectedArticles.some((a) => a.url === article.url)
                        ? "Selected"
                        : "Select"}
                    </button>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
                    >
                      Read
                      <ExternalLink size={14} className="ml-1" />
                    </a>
                  </div>
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

export default TrumpNewsAIAgent;
