import spacy
import re
from collections import Counter

# Try to load the model, provide helpful error if missing
try:
    nlp = spacy.load('en_core_web_sm')
except OSError:
    print("Downloading 'en_core_web_sm' model. Please wait...")
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load('en_core_web_sm')

class PrivacyAnalyzer:
    def __init__(self):
        # Using lemmas and exact words for single-word tokens
        self.risk_tokens = {'sell', 'track', 'collect', 'cookie', 'cookies', 'share'}
        # Phrases or hyphenated words that might be split by tokenizer
        self.multi_word_tokens = {'third-party'}
        self.total_score = 0

    def normalize_text(self, text: str) -> str:
        """
        Cleans the input text by:
        - Removing bracketed citations (e.g., [1], [2], [14])
        - Collapsing multiple spaces and newlines into a single space
        """
        # Remove citation brackets like [1], [34]
        text = re.sub(r'\[\d+\]', '', text)
        # Collapse whitespace/newlines to single space
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def analyze(self, text: str, limit: int = 3) -> dict:
        """
        Analyzes the text and returns a structured dictionary result:
        {
          "summary": [list of top sentences],
          "risk_level": "High/Medium/Low",
          "total_score": int,
          "companies_found": [list of top 5 entities (ORG)]
        }
        """
        cleaned_text = self.normalize_text(text)
        doc = nlp(cleaned_text)
        
        sentence_scores = {}
        self.total_score = 0
        organizations = []
        
        # Identify Organizations using Named Entity Recognition
        for ent in doc.ents:
            if ent.label_ == 'ORG':
                org_name = ent.text.strip()
                # Simple cleanup for common punctuation that gets caught
                org_name = org_name.strip('.,;:"\'()')
                if len(org_name) > 1:
                    organizations.append(org_name)
                    
        # Get top 5 unique organizations based on frequency
        org_counts = Counter(organizations)
        top_orgs = [org for org, count in org_counts.most_common(5)]
        
        # Score the text and extract top sentences
        for sent in doc.sents:
            score = 0
            # Evaluate single-word risk tokens
            for token in sent:
                word = token.text.lower()
                lemma = token.lemma_.lower()
                
                if word in self.risk_tokens or lemma in self.risk_tokens:
                    # Give triple weight if it acts as a VERB
                    if token.pos_ == 'VERB':
                        score += 3
                    # Give base weight (1) for NOUNs and other forms
                    else:
                        score += 1

            # Evaluate multi-word phrases (e.g., 'third-party')
            sent_text_lower = sent.text.lower()
            for phrase in self.multi_word_tokens:
                if phrase in sent_text_lower:
                    # Non-verbs get a weight of 1 per occurrence
                    score += sent_text_lower.count(phrase)
            
            if score > 0:
                sentence_scores[sent.text.strip()] = score
            
            self.total_score += score
            
        # Sort sentences by score in descending order
        sorted_sentences = sorted(sentence_scores.items(), key=lambda item: item[1], reverse=True)
        top_sentences = [sent[0] for sent in sorted_sentences[:limit]]
        
        # Calculate Risk Level
        if self.total_score >= 10:
            risk_level = "High"
        elif self.total_score >= 5:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        return {
            "summary": top_sentences,
            "risk_level": risk_level,
            "total_score": self.total_score,
            "companies_found": top_orgs
        }

    def analyze_ui_elements(self, elements: list) -> list:
        """
        Parses DOM elements sent back from the Chrome extension and matches 
        them against UX Dark Pattern categories.
        """
        patterns = []
        
        # New Deceptive UI checks (Confirmshaming)
        deceptive_keywords = ["no thanks", "maybe later", "i don't want to save money"]
        
        for element in elements:
            element_str = str(element).lower()
            
            # Legacy Urgent/Sneaking mappings
            if "urgency" in element_str or "countdown" in element_str:
                patterns.append("Fake Urgency / Scarcity")
            if "pre-checked" in element_str or "default" in element_str:
                patterns.append("Pre-selection / Default Bias")
            if "trick" in element_str or "hidden" in element_str:
                patterns.append("Sneaking / Hidden Costs")
            if "hidden exit" in element_str:
                patterns.append("Trick Questions / Hidden Exit")
                
            # Scan for ConfirmShaming
            for kw in deceptive_keywords:
                if kw in element_str:
                    patterns.append("Confirmshaming")
                    break

        # Remove duplicates while holding order
        return list(set(patterns))

if __name__ == "__main__":
    analyzer = PrivacyAnalyzer()
    
    # Try reading from test file if available, else fallback to sample text
    try:
        with open("test_policy.txt", "r", encoding="utf-8") as f:
            sample_text = f.read()
    except FileNotFoundError:
        sample_text = (
            "We care deeply about your privacy [1]. \n\n"
            "We collect your personal information to improve our services and user experience at Google [2]. "
            "However, we may share or sell your personal data to third-party data brokers. "
            "We use cookies to track your behavior across different websites. \n"
            "Meta and OpenAI will never share your password with anyone."
        )
        
    print("--- Privacy Policy Analysis ---\n")
    print(f"Original Text Length: {len(sample_text)} characters\n")
    
    # Run the structural analyzer
    results = analyzer.analyze(sample_text, limit=3)
    
    # Pretty print the JSON output
    import json
    print(json.dumps(results, indent=2))
