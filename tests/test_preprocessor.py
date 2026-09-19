"""
Unit tests for text preprocessor.
"""

from app.ml.preprocessor import clean_text, combine_title_and_text

def test_clean_text_basic():
    raw = "  Test Headline Text  "
    cleaned = clean_text(raw)
    assert cleaned == "test headline text"

def test_clean_text_removes_stopwords_and_urls():
    raw = "Breaking news at http://example.com about a great discovery in 2026!"
    cleaned = clean_text(raw)
    assert "http" not in cleaned
    assert "example" not in cleaned
    assert "discovery" in cleaned

def test_combine_title_and_text():
    title = "Space Discovery"
    text = "Astronomers found a new planet."
    combined = combine_title_and_text(title, text)
    assert "space discovery space discovery" in combined
