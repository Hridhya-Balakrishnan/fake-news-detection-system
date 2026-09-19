/**
 * Client-side JavaScript logic for Fake News Detection System.
 */

const API_BASE_URL = (window.location.port === "5500" || window.location.port === "5501") ? "http://127.0.0.1:8000" : "";

document.addEventListener("DOMContentLoaded", () => {
    // Tab switching elements
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    // Form elements
    const form = document.getElementById("prediction-form");
    const headlineInput = document.getElementById("headline");
    const textInput = document.getElementById("article-text");
    const sampleGenuineBtn = document.getElementById("sample-genuine-btn");
    const sampleFakeBtn = document.getElementById("sample-fake-btn");
    const clearBtn = document.getElementById("clear-btn");
    const analyzeBtn = document.getElementById("analyze-btn");
    const btnText = document.getElementById("btn-text");
    const btnSpinner = document.getElementById("btn-spinner");

    // Prediction result elements
    const placeholderState = document.getElementById("placeholder-state");
    const resultContent = document.getElementById("result-content");
    const predictionBadge = document.getElementById("prediction-badge");
    const confidenceValue = document.getElementById("confidence-value");
    const confidenceBar = document.getElementById("confidence-bar");
    const probGenuine = document.getElementById("prob-genuine");
    const probFake = document.getElementById("prob-fake");
    const academicDisclaimerText = document.getElementById("academic-disclaimer-text");

    // Metrics elements
    const metricsLoading = document.getElementById("metrics-loading");
    const metricsDisplay = document.getElementById("metrics-display");
    const cmSection = document.getElementById("cm-section");
    const metricAcc = document.getElementById("metric-acc");
    const metricPrec = document.getElementById("metric-prec");
    const metricRec = document.getElementById("metric-rec");
    const metricF1 = document.getElementById("metric-f1");
    const metricAuc = document.getElementById("metric-auc");
    const cmTn = document.getElementById("cm-tn");
    const cmFp = document.getElementById("cm-fp");
    const cmFn = document.getElementById("cm-fn");
    const cmTp = document.getElementById("cm-tp");

    // History elements
    const historyTableBody = document.getElementById("history-table-body");

    // Tab Navigation Logic
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetTab = btn.getAttribute("data-tab");

            tabBtns.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.classList.add("hidden"));

            btn.classList.add("active");
            document.getElementById(targetTab).classList.remove("hidden");

            if (targetTab === "tab-metrics") {
                fetchModelMetrics();
            } else if (targetTab === "tab-history") {
                fetchPredictionHistory();
            }
        });
    });

    // Sample data presets
    const sampleGenuine = {
        title: "NASA James Webb Space Telescope Observes Distant Spiral Galaxy",
        text: "Astronomers today published new findings from the James Webb Space Telescope, detailing observations of a spiral galaxy formed over 12 billion years ago. The research team confirmed that light spectrum readings indicate ongoing star formation and complex elemental distribution across deep space."
    };

    const sampleFake = {
        title: "SHOCKING: Secret Alien Metropolis Discovered Under Antarctic Ice Sheet",
        text: "Anonymous whistleblowers claim world governments are hiding a massive underground alien city beneath the South Pole. Leaked satellite images allegedly show advanced antigravity propulsion labs and ancient pyramids operating completely outside public knowledge."
    };

    sampleGenuineBtn.addEventListener("click", () => {
        headlineInput.value = sampleGenuine.title;
        textInput.value = sampleGenuine.text;
    });

    sampleFakeBtn.addEventListener("click", () => {
        headlineInput.value = sampleFake.title;
        textInput.value = sampleFake.text;
    });

    clearBtn.addEventListener("click", () => {
        headlineInput.value = "";
        textInput.value = "";
        placeholderState.classList.remove("hidden");
        resultContent.classList.add("hidden");
    });

    // Prediction Submit Event
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = headlineInput.value.trim();
        const text = textInput.value.trim();

        if (!title || !text) {
            alert("Please provide both the headline title and article text.");
            return;
        }

        btnText.textContent = "Processing...";
        btnSpinner.classList.remove("hidden");
        analyzeBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/api/predict`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ title, text })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || "Server error while generating prediction.");
            }

            const data = await response.json();
            renderPrediction(data);
            fetchPredictionHistory(); // refresh history log
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            btnText.textContent = "Run Model Assessment";
            btnSpinner.classList.add("hidden");
            analyzeBtn.disabled = false;
        }
    });

    function renderPrediction(data) {
        placeholderState.classList.add("hidden");
        resultContent.classList.remove("hidden");

        const isGenuine = data.prediction === "Likely Genuine";
        predictionBadge.textContent = `${data.prediction} (${data.confidence.toFixed(1)}% Confidence)`;
        predictionBadge.className = `prediction-badge ${isGenuine ? "genuine" : "fake"}`;

        confidenceValue.textContent = `${data.confidence.toFixed(1)}%`;
        confidenceBar.style.width = `${data.confidence}%`;

        probGenuine.textContent = `${(data.prob_genuine * 100).toFixed(1)}%`;
        probFake.textContent = `${(data.prob_fake * 100).toFixed(1)}%`;
        academicDisclaimerText.textContent = data.disclaimer;
    }

    // Fetch and Render Model Metrics
    async function fetchModelMetrics() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/metrics`);
            const data = await response.json();

            if (!data.accuracy) {
                metricsLoading.textContent = data.details?.message || "Model metrics not available. Please train the model first.";
                metricsDisplay.classList.add("hidden");
                cmSection.classList.add("hidden");
                return;
            }

            metricsLoading.classList.add("hidden");
            metricsDisplay.classList.remove("hidden");

            metricAcc.textContent = `${(data.accuracy * 100).toFixed(1)}%`;
            metricPrec.textContent = `${(data.precision * 100).toFixed(1)}%`;
            metricRec.textContent = `${(data.recall * 100).toFixed(1)}%`;
            metricF1.textContent = `${(data.f1_score * 100).toFixed(1)}%`;
            metricAuc.textContent = `${data.roc_auc.toFixed(3)}`;

            if (data.confusion_matrix && data.confusion_matrix.length === 2) {
                cmSection.classList.remove("hidden");
                cmTn.textContent = data.confusion_matrix[0][0];
                cmFp.textContent = data.confusion_matrix[0][1];
                cmFn.textContent = data.confusion_matrix[1][0];
                cmTp.textContent = data.confusion_matrix[1][1];
            }
        } catch (err) {
            metricsLoading.textContent = "Error loading metrics: " + err.message;
        }
    }

    // Fetch and Render Prediction History
    async function fetchPredictionHistory() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/history`);
            const rows = await response.json();

            if (!rows || rows.length === 0) {
                historyTableBody.innerHTML = `<tr><td colspan="5" class="empty-table-msg">No analysis history recorded yet.</td></tr>`;
                return;
            }

            historyTableBody.innerHTML = rows.map(item => {
                const isGenuine = item.prediction === "Likely Genuine";
                const dateStr = new Date(item.created_at).toLocaleString();
                return `
                    <tr>
                        <td>${item.id}</td>
                        <td title="${escapeHtml(item.text_snippet)}"><strong>${escapeHtml(item.title)}</strong></td>
                        <td><span style="color: ${isGenuine ? '#10b981' : '#ef4444'}; font-weight: 600;">${item.prediction}</span></td>
                        <td>${item.confidence.toFixed(1)}%</td>
                        <td>${dateStr}</td>
                    </tr>
                `;
            }).join("");
        } catch (err) {
            console.error("Error fetching history:", err);
        }
    }

    function escapeHtml(str) {
        return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    // Initial history load
    fetchPredictionHistory();
});
