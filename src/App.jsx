import React, { useState } from "react";
import TrumpNewsAIAgent from "./aiagenttest";
import MemeAndSoundbiteGenerator from "./meme";

const App = () => {
  const [selectedArticles, setSelectedArticles] = useState([]);

  // Function to be passed to TrumpNewsAIAgent to update selected articles
  const handleArticleSelection = (articles) => {
    setSelectedArticles(articles);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          Trump News AI Dashboard
        </h1>

        {/* Meme & Soundbite Generator Component */}
        <MemeAndSoundbiteGenerator selectedArticles={selectedArticles} />

        {/* Main News AI Agent Component */}
        <TrumpNewsAIAgent onArticleSelection={handleArticleSelection} />
      </div>
    </div>
  );
};

export default App;
