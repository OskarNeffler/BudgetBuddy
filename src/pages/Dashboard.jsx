// rrd imports
import { useLoaderData } from "react-router-dom";
import { useState, useEffect } from "react";

// library imports
import { toast } from "react-toastify";

// components
import Intro from "../components/Intro";

// helper functions
import { fetchData, waait, truncateText, formatDate } from "../helpers";

// --- Loader ---
export function dashboardLoader() {
  const userName = fetchData("userName");
  return { userName };
}

// --- Action ---
export async function dashboardAction({ request }) {
  await waait();

  const data = await request.formData();
  const { _action, ...values } = Object.fromEntries(data);

  // new user submission
  if (_action === "newUser") {
    try {
      localStorage.setItem("userName", JSON.stringify(values.userName));
      return toast.success(`Welcome, ${values.userName}`);
    } catch (e) {
      throw new Error("There was a problem creating your account.");
    }
  }
}

// --- Dashboard-komponenten ---
const Dashboard = () => {
  const { userName } = useLoaderData();
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hämta nyheter när användaren är inloggad (dvs. userName finns)
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "http://51.20.22.69:3000/api/bors-nyheter"
        );
        if (!response.ok) {
          throw new Error("Kunde inte hämta nyheter");
        }

        // API-svaret: { total, offset, limit, articles: [...] }
        const data = await response.json();
        const articlesArray = data.articles || [];

        setNewsData(articlesArray);
        setError(null);
      } catch (error) {
        console.error("Error fetching news:", error);
        setError("Kunde inte hämta nyheter. Kontrollera API-anslutningen.");
      } finally {
        setLoading(false);
      }
    };

    if (userName) {
      fetchNews();
    }
  }, [userName]);

  return (
    <>
      {userName ? (
        // Om användare redan är skapad, visa nyheter
        <div className="dashboard">
          <h2>
            Welcome back, <span className="accent">{userName}</span>
          </h2>
          <div className="grid-lg">
            <h3>Nyheter från Dagens Industri</h3>

            {loading ? (
              <div className="grid-sm">
                <p>Laddar nyheter...</p>
              </div>
            ) : error ? (
              <div className="grid-sm">
                <p>{error}</p>
              </div>
            ) : newsData.length === 0 ? (
              <div className="grid-sm">
                <p>Inga nyheter tillgängliga.</p>
              </div>
            ) : (
              <div className="news-container">
                {newsData.map((article, index) => {
                  // Byt ut &width=90&quality=70 mot en större variant
                  const biggerImageUrl = article.imageUrl
                    ? article.imageUrl.replace(
                        "&width=90&quality=70",
                        "&width=400&quality=80"
                      )
                    : null;

                  return (
                    <div key={index} className="news-item">
                      <a
                        href={article.url}
                        className="news-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {/* Visa endast <img> om vi har en bild-URL */}
                        {biggerImageUrl && (
                          <img
                            src={biggerImageUrl}
                            alt={article.title}
                            className="news-image-tag"
                          />
                        )}

                        <div className="news-content">
                          <h3 className="news-title">{article.title}</h3>
                          <p className="news-summary">
                            {truncateText(article.summary, 150)}
                          </p>
                          <small className="news-date">
                            {article.publishedAt
                              ? formatDate(article.publishedAt)
                              : "Nyligen publicerad"}
                          </small>
                        </div>
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Om ingen användare finns, visa Intro-komponenten med formuläret
        <Intro />
      )}
    </>
  );
};

export default Dashboard;
