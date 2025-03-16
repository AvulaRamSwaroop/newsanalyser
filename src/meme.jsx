import React, { useState, useEffect, useRef } from "react";
import { Groq } from "groq-sdk";
import {
  Image,
  Volume2,
  Copy,
  Download,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Share2,
} from "lucide-react";
import html2canvas from "html2canvas";
import m1 from "./assets/m1.jpg" 
import m2 from "./assets/1bgw.jpg" 
import m3 from "./assets/1e7ql7.jpg" 
import m4 from "./assets/1otk96.jpg" 
import m5 from "./assets/1ur9b0.jpg" 
import m6 from "./assets/3lmzyx.jpg" 
import m7 from "./assets/3oevdk.jpg" 
import m8 from "./assets/3qqcim.jpg" 
import m9 from "./assets/4acd7j.jpg" 
import m10 from "./assets/4t0m5.jpg" 
import m11 from "./assets/4xgqu.jpg" 
import m12 from "./assets/9ehk.jpg" 
import m13 from "./assets/9vct.jpg" 
import m14 from "./assets/24y43o.jpg" 
import m15 from "./assets/28j0te.jpg" 
import m16 from "./assets/grr.jpg"
const MemeAndSoundbiteGenerator = ({ selectedArticles = [] }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [contentType, setContentType] = useState("meme");
  const [memeStyle, setMemeStyle] = useState("funny");
  const [soundbiteStyle, setSoundbiteStyle] = useState("quote");
  const [feedback, setFeedback] = useState({ likes: 0, dislikes: 0 });
  const groqClient = useRef(null);
  const memeRef = useRef(null);
  const [memeTemplates] = useState([
m1,m2,m3,m4,m5,m6,m7,m8,m9,m10,m11,m12,m13,m14,m15,m16  ]);

  const [selectedTemplate, setSelectedTemplate] = useState(0);

  // Initialize Groq client
  useEffect(() => {
    groqClient.current = new Groq({
      apiKey: import.meta.env.VITE_REACT_APP_GROQ_API_KEY,
      dangerouslyAllowBrowser: true,
    });
  }, []);

  const generateContent = async () => {
    if (selectedArticles.length === 0) {
      alert("Please select at least one article to generate content");
      return;
    }

    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      // Prepare the articles data for the AI
      const articlesData = selectedArticles.map((article) => ({
        title: article.title,
        source: article.source.name,
        description: article.description,
        content: article.content,
        publishedAt: article.publishedAt,
      }));

      let systemPrompt = "";
      let userPrompt = "";

      if (contentType === "meme") {
        systemPrompt = `You are a creative meme generator specializing in political humor. Your task is to create witty, ${memeStyle} memes about Donald Trump based on current news.`;

        userPrompt = `Create a meme based on these Trump-related news articles: ${JSON.stringify(
          articlesData
        )}. 
        
        Return a JSON object with:
        1. "topText": The text that should appear at the top of the meme (keep it short and punchy)
        2. "bottomText": The text that should appear at the bottom of the meme (the punchline)
        3. "altText": A brief description of what the meme is about
        4. "sourceArticle": The title of the article that inspired this meme
        
        Make it ${memeStyle} in tone. Be creative but ensure it's related to the news content.`;
      } else {
        systemPrompt = `You are a political soundbite creator who can craft memorable ${soundbiteStyle}s from news articles about Donald Trump.`;

        userPrompt = `Create a ${
          soundbiteStyle === "quote"
            ? "notable quote"
            : soundbiteStyle === "parody"
            ? "parody soundbite"
            : "remixed statement"
        } based on these Trump-related news articles: ${JSON.stringify(
          articlesData
        )}.
        
        Return a JSON object with:
        1. "text": The actual soundbite text (keep it under 50 words, make it catchy and memorable)
        2. "context": Brief context explaining what this is referring to
        3. "sourceArticle": The title of the article that inspired this soundbite
        4. "speakerVoice": Who would be saying this (e.g., "Trump", "Commentator", "Comedian", etc.)
        
        Make it in a ${soundbiteStyle} style. Be creative but ensure it's related to the news content.`;
      }

      // Call Groq API with Llama 3 model
      const completion = await groqClient.current.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: "llama3-8b-8192",
        temperature: 0.9,
        max_tokens: 500,
        response_format: { type: "json_object" },
      });

      const content = JSON.parse(completion.choices[0].message.content);
      setGeneratedContent(content);

      // Randomly select a new template for variety
      setSelectedTemplate(Math.floor(Math.random() * memeTemplates.length));
    } catch (error) {
      console.error("Content generation error:", error);
      alert("Failed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadMeme = async () => {
    if (!memeRef.current) return;

    try {
      const canvas = await html2canvas(memeRef.current);
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = "trump-meme.png";
      link.click();
    } catch (error) {
      console.error("Error downloading meme:", error);
    }
  };

  const copyToClipboard = () => {
    if (!generatedContent) return;

    const textToCopy =
      contentType === "meme"
        ? `${generatedContent.topText} ... ${generatedContent.bottomText}`
        : generatedContent.text;

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => alert("Copied to clipboard!"))
      .catch((err) => console.error("Failed to copy:", err));
  };

  const shareSocial = () => {
    // In a real app, this would integrate with social media APIs
    // For now, we'll just simulate with an alert
    alert(
      "Social sharing would be implemented here with proper API integration"
    );
  };

  const giveFeedback = (type) => {
    if (type === "like") {
      setFeedback({ ...feedback, likes:1,dislikes: 0 });
    } else {
      setFeedback({ ...feedback, dislikes: 1,likes: 0 });
    }
    // In a real app, you would send this feedback to your backend
  };

  // Text-to-speech for soundbites (browser API)
  const playSoundbite = () => {
    if (!generatedContent || contentType !== "soundbite") return;

    const utterance = new SpeechSynthesisUtterance(generatedContent.text);
    // Adjust voice based on the speaker
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Try to find a male voice for Trump or a voice that matches the speaker
      const voice = voices.find((v) => v.name.includes("Male")) || voices[0];
      utterance.voice = voice;
    }
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4">Meme & Soundbite Generator</h2>

      {/* Content Type Selector */}
      <div className="flex mb-6">
        <button
          onClick={() => setContentType("meme")}
          className={`flex-1 py-2 px-4 flex items-center justify-center rounded-l-md ${
            contentType === "meme"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          <Image size={18} className="mr-2" />
          Meme Generator
        </button>
        <button
          onClick={() => setContentType("soundbite")}
          className={`flex-1 py-2 px-4 flex items-center justify-center rounded-r-md ${
            contentType === "soundbite"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          <Volume2 size={18} className="mr-2" />
          Soundbite Creator
        </button>
      </div>

      {/* Style Selector */}
      {contentType === "meme" ? (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meme Style:
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => setMemeStyle("funny")}
              className={`px-3 py-1 rounded-md text-sm ${
                memeStyle === "funny"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Funny
            </button>
            <button
              onClick={() => setMemeStyle("political")}
              className={`px-3 py-1 rounded-md text-sm ${
                memeStyle === "political"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Political
            </button>
            <button
              onClick={() => setMemeStyle("satirical")}
              className={`px-3 py-1 rounded-md text-sm ${
                memeStyle === "satirical"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Satirical
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Soundbite Style:
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => setSoundbiteStyle("quote")}
              className={`px-3 py-1 rounded-md text-sm ${
                soundbiteStyle === "quote"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Direct Quote
            </button>
            <button
              onClick={() => setSoundbiteStyle("parody")}
              className={`px-3 py-1 rounded-md text-sm ${
                soundbiteStyle === "parody"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Parody
            </button>
            <button
              onClick={() => setSoundbiteStyle("remix")}
              className={`px-3 py-1 rounded-md text-sm ${
                soundbiteStyle === "remix"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Remix
            </button>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="mb-6">
        <button
          onClick={generateContent}
          disabled={isGenerating || selectedArticles.length === 0}
          className={`w-full py-3 rounded-md text-white font-medium flex items-center justify-center ${
            isGenerating || selectedArticles.length === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              {contentType === "meme" ? (
                <Image size={18} className="mr-2" />
              ) : (
                <Volume2 size={18} className="mr-2" />
              )}
              Generate {contentType === "meme" ? "Meme" : "Soundbite"}
            </>
          )}
        </button>
      </div>

      {/* Generated Content Display */}
      {generatedContent && (
        <div className="border rounded-lg p-4">
          {contentType === "meme" ? (
            <>
              {/* Meme Display */}
              <div
                ref={memeRef}
                className="relative mb-4 bg-black rounded-md overflow-hidden"
                style={{ width: "100%", maxWidth: "500px", margin: "0 auto" }}
              >
                <img
                  src={memeTemplates[selectedTemplate]}
                  alt="Meme template"
                  className="w-full"
                />
                <div className="absolute top-2 left-0 right-0 text-center text-white text-xl font-bold uppercase px-4 meme-text">
                  {generatedContent.topText}
                </div>
                <div className="absolute bottom-2 left-0 right-0 text-center text-white text-xl font-bold uppercase px-4 meme-text">
                  {generatedContent.bottomText}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Based on:</strong> {generatedContent.sourceArticle}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                {generatedContent.altText}
              </p>
            </>
          ) : (
            <>
              {/* Soundbite Display */}
              <div className="bg-gray-100 p-4 rounded-md mb-4">
                <p className="text-lg font-medium mb-2 italic">
                  "{generatedContent.text}"
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Speaker:</strong> {generatedContent.speakerVoice}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Based on:</strong> {generatedContent.sourceArticle}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  {generatedContent.context}
                </p>
                <button
                  onClick={playSoundbite}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Volume2 size={16} className="mr-2" />
                  Play Soundbite
                </button>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {contentType === "meme" && (
              <button
                onClick={downloadMeme}
                className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center"
              >
                <Download size={16} className="mr-1" />
                Download
              </button>
            )}
            <button
              onClick={copyToClipboard}
              className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center"
            >
              <Copy size={16} className="mr-1" />
              Copy
            </button>
            <button
              onClick={shareSocial}
              className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
            >
              <Share2 size={16} className="mr-1" />
              Share
            </button>
            <button
              onClick={generateContent}
              className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            >
              <RefreshCw size={16} className="mr-1" />
              Regenerate
            </button>
          </div>

          {/* Feedback */}
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600 mr-2">Was this useful?</span>
            <button
              onClick={() => giveFeedback("like")}
              className="p-1 text-gray-600 hover:text-blue-600 flex items-center"
            >
              <ThumbsUp size={16} className="mr-1" />
              <span>{feedback.likes}</span>
            </button>
            <button
              onClick={() => giveFeedback("dislike")}
              className="p-1 text-gray-600 hover:text-red-600 flex items-center ml-2"
            >
              <ThumbsDown size={16} className="mr-1" />
              <span>{feedback.dislikes}</span>
            </button>
          </div>
        </div>
      )}

      {/* No Articles Selected Warning */}
      {selectedArticles.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          Please select at least one news article to generate content
        </div>
      )}

      {/* CSS for meme text */}
      <style jsx>{`
        .meme-text {
          text-shadow: 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000,
            -2px 2px 0 #000;
          font-family: Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif;
          letter-spacing: 1px;
        }
      `}</style>
    </div>
  );
};

export default MemeAndSoundbiteGenerator;
