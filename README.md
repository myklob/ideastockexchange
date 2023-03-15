import spacy

# Load the English language model in spacy
nlp = spacy.load("en_core_web_md")

def ssm_score(statement1, statement2):
    """
    Calculates the semantic similarity score between two statements using cosine similarity
    """
    doc1 = nlp(statement1)
    doc2 = nlp(statement2)
    
    return doc1.similarity(doc2)
