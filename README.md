# Lost & Found Web Application

## 1. Overview

This project is a web-based Lost & Found system that allows users to post and search for lost items.  
It integrates both text-based and image-based matching to improve search accuracy.

The goal is to provide a simple and efficient platform where users can either report found items or search for their lost belongings.

---

## 2. Key Features

- Post items with image, description, and keywords  
- Search using text, image, or both  
- Automatic keyword extraction from user input  
- Highlight matched keywords in results  
- Two display modes:
  - Large view (detailed)
  - Compact view (grid layout)  
- Image-based similarity matching using a trained model  
- Dynamic re-ranking of results based on similarity score  

---

## 3. Matching Logic

The system combines text similarity and image similarity:

- Text similarity is computed using keyword overlap (Jaccard similarity)
- Image similarity is computed using a Siamese neural network model

Final score:

Score = 0.8 * Image Similarity + 0.2 * Text Similarity


If no image is provided, only text similarity is used.

---

## 4. Tech Stack

**Frontend**
- HTML
- CSS
- JavaScript

**Database**
- SQLite

**Image Processing**
- TensorFlow.js
- Pre-trained Siamese Model

**System Infrastructure**
- Python (Flask)
- SQLite
---

## 5. How to Run
1. Install dependencies
```bash
pip3 install -r requirements.txt
```
2. Initialize the database
```bash
python3 init_db.py
```
3. Start the application
```bash
python3 app.py
```
4. Open in browser
```bash
http://127.0.0.1:5050
```
