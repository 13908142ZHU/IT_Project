def normalize_text(text: str) -> str:
    return (text or "").strip().lower() #key words normalization

def tokenize(text: str): #tokenization after normalization
    text = normalize_text(text)
    if not text:
        return set()

    tokens = []
    for part in text.replace(",", " ").split():
        if part:
            tokens.append(part)
    return set(tokens)

def text_similarity(desc1: str, kw1: str, desc2: str, kw2: str) -> float:
    set1 = tokenize(desc1) | tokenize(kw1) #combine feature description and key words
    set2 = tokenize(desc2) | tokenize(kw2)

    if not set1 or not set2:
        return 0.0

    inter = len(set1 & set2) #find the intersection length
    union = len(set1 | set2) #find the union length
    return inter / union #Jaccard Similarity is their lengths' ratio

def calculate_text_score(search_desc, search_kw, item_desc, item_kw):
    return round(text_similarity(search_desc, search_kw, item_desc, item_kw), 2) #round similarity score to 2 decimal

def should_display(score: float, threshold: float = 0.05) -> bool: #5% similarity as display thredshold
    return score >= threshold #compare to determine display or not
