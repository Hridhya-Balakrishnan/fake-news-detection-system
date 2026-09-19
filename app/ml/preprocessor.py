"""
Text Preprocessing Module using NLTK and scikit-learn compatible regex normalization.
"""

import re
import string
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# Ensure required NLTK datasets are downloaded
def ensure_nltk_data():
    """
    Downloads required NLTK resource packages if not already installed.
    """
    resources = ['stopwords', 'wordnet', 'omw-1.4', 'punkt']
    for resource in resources:
        try:
            nltk.data.find(f'corpora/{resource}')
        except LookupError:
            try:
                nltk.data.find(f'tokenizers/{resource}')
            except LookupError:
                nltk.download(resource, quiet=True)

ensure_nltk_data()

# Initialize NLTK components
try:
    STOP_WORDS = set(stopwords.words('english'))
except Exception:
    ensure_nltk_data()
    STOP_WORDS = set(stopwords.words('english'))

LEMMATIZER = WordNetLemmatizer()

def clean_text(text: str) -> str:
    """
    Normalizes and cleans input news text for TF-IDF feature extraction.
    
    Steps:
    1. Lowercase text
    2. Remove HTML tags, URLs, email addresses
    3. Remove punctuation, numbers, and special characters
    4. Tokenize and remove English stopwords
    5. Apply Lemmatization to reduce words to root forms
    """
    if not text or not isinstance(text, str):
        return ""

    # 1. Lowercase
    text = text.lower()

    # 2. Strip HTML tags
    text = re.sub(r'<[^>]+>', ' ', text)

    # 3. Strip URLs and Email addresses
    text = re.sub(r'http\S+|www\.\S+|ftp\S+', ' ', text)
    text = re.sub(r'\S+@\S+', ' ', text)

    # 4. Strip punctuation, digits, and special characters
    text = re.sub(r'[^a-z\s]', ' ', text)

    # 5. Tokenize, remove stopwords, and lemmatize
    tokens = text.split()
    cleaned_tokens = [
        LEMMATIZER.lemmatize(word) 
        for word in tokens 
        if word not in STOP_WORDS and len(word) > 2
    ]

    return " ".join(cleaned_tokens)

def combine_title_and_text(title: str, text: str) -> str:
    """
    Combines headline title and article text with weighted emphasis on title.
    """
    clean_title = clean_text(title or "")
    clean_body = clean_text(text or "")
    # Title terms are repeated twice to give headline terms strong feature weighting
    return f"{clean_title} {clean_title} {clean_body}".strip()
