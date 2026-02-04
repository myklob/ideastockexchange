# Media

## Why We Link Media to Beliefs
To effectively challenge flawed ideas, we must identify the **most impactful media**—books, documentaries, podcasts, images, and scientific studies—that significantly influence each belief.

- Linking **supporting and opposing media** side-by-side encourages balanced understanding.
- Extracting arguments from media sources (books, poems, films) and analyzing them prevents misinformation.
- This process promotes critical thinking and a willingness to consider alternative perspectives.

---

## How It Works
Our platform allows users to:
1. Submit **top media choices** that support or oppose specific beliefs.
2. Provide **pro/con arguments** explaining why each media item is important.
3. Rank submissions based on argument performance and overall scores.

**Supported media types**:
- Books
- Movies
- Songs
- Laws
- Websites & links
- Videos
- Images (e.g., political cartoons, photojournalism)
- Podcasts

---

## Examples
- *Freakonomics* by Steven D. Levitt & Stephen J. Dubner — Exploring hidden sides of social and economic phenomena.
- *An Inconvenient Truth* (Al Gore) — Highlighting urgency of climate action.

---

## Scoring System for Sorting Media
```

Impact Score = Sales Data Score × Engagement Score × UGC Score × Citation Score × Viewership Score × Validity Score × Linkage Score × Unique Score

```

**Key score components**:
- **Sales Data Score** — Copies sold (normalized 0–1).
- **Engagement Score** — Likes, shares, comments (normalized).
- **UGC Score** — User ratings from platforms like Goodreads, IMDb.
- **Citation Score** — Frequency in academic/media citations.
- **Viewership Score** — Audience reach (for video/live content).
- **Validity Score** — Argument strength from our forum.
- **Linkage Score** — Confidence that the media truly supports/opposes the belief.
- **Unique Score** — Avoids double-counting redundant arguments.

---

## Website Features
- Submit media agreeing/disagreeing with a belief.
- Vote on media relevance & accuracy.
- Weigh credibility higher for users who:
  - Have read/seen the media
  - Have purchased or reviewed it
  - Written essays or analyses

---

## Book Scoring Metrics

### **Book Accuracy Score (BAS)**
```

BAS = Σ(BLS × BTS × BUS × BIS)

```
- **BLS** — Book Linkage Score: Alignment between book points and belief.
- **BTS** — Book Truth Score: Average of logical soundness & verifiability scores.
- **BUS** — Book Uniqueness Score: Novelty of claims.
- **BIS** — Book Importance Score: Popularity, reviews, citations.

**Example BTS formula**:
```

BTS = (Logical Soundness Score + Verifiability Score) / 2

````

---

### **Book Aesthetic Quality Score (BAQS)**
Evaluates:
- Clarity
- Flow
- Originality
- Style
- Engagement
- Grammar
- Brevity
- Humor
- Imagery

**Note:** BAQS may not affect belief scores unless linked to argument quality, but it helps identify “best” books for/against a belief.

---

## Example Python Code

**Calculate BAS**
```python
def calculate_BAS(books):
    BAS = 0
    for book in books:
        BLS = calculate_BLS(book)
        BTS = calculate_BTS(book)
        BUS = calculate_BUS(book)
        BIS = calculate_BIS(book)
        BAS += BLS * BTS * BUS * BIS
    return BAS
````

**Book Linkage Score**

```python
def calculate_BLS(linkage_args):
    return sum(arg['pro_score'] - arg['con_score'] for arg in linkage_args)
```

**Book Truth Score**

```python
def calculate_BTS(logical_soundness_args, verifiability_args):
    LS = sum(arg['pro_score'] - arg['con_score'] for arg in logical_soundness_args)
    VS = sum(arg['pro_score'] - arg['con_score'] for arg in verifiability_args)
    return (LS + VS) / 2
```

**Book Uniqueness Score**

```python
def calculate_BUS(uniqueness_args):
    return sum(arg['pro_score'] - arg['con_score'] for arg in uniqueness_args)
```

**Book Importance Score**

```python
def calculate_BIS(SS, RS, CS):
    return (SS + RS + CS) / 3
```

---

## Conclusion

By linking media to the beliefs they support or challenge—and scoring them across **accuracy, truthfulness, uniqueness, and importance**—we create a transparent, balanced, and evidence-based framework for public discourse.

