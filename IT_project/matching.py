def normalize_text(text: str) -> str:
    return (text or "").strip().lower()

def tokenize(text: str):
    text = normalize_text(text)
    if not text:
        return set()

    tokens = []
    for part in text.replace(",", " ").split():
        if part:
            tokens.append(part)
    return set(tokens)

def text_similarity(desc1: str, kw1: str, desc2: str, kw2: str) -> float:
    set1 = tokenize(desc1) | tokenize(kw1)
    set2 = tokenize(desc2) | tokenize(kw2)

    if not set1 or not set2:
        return 0.0

    inter = len(set1 & set2)
    union = len(set1 | set2)
    return inter / union

def calculate_text_score(search_desc, search_kw, item_desc, item_kw):
    return round(text_similarity(search_desc, search_kw, item_desc, item_kw), 2)

def should_display(score: float, threshold: float = 0.05) -> bool:
    return score >= threshold