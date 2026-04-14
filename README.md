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
- JavaScript
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
## 6. Viewing Model Training & Evaluation Results (Model Summary)

The project includes a separate page that demonstrates how the Siamese neural network is trained and evaluated. It shows accuracy curves, loss curves, and confusion matrices for both the baseline (MobileNetV2) and the trained Siamese model.

### How to run the model evaluation page

1. **Make sure you are in the project root folder** (`IT_project/`).

2. **Start a local HTTP server** (required because TensorFlow.js loads model files via fetch).  
   - *Option A (easiest):* Open `matching_model_summary/model_evaluation.html` in VSCode, right‑click and select **“Open with Live Server”**.  
   - *Option B:* Run `python -m http.server 8000` in the terminal, then visit `http://localhost:8000/matching_model_summary/model_evaluation.html`.

3. **Wait 20–30 seconds** – the page will automatically:
   - Load training images from GitHub.
   - Train the Siamese network.
   - Display the training loss/accuracy curves.
   - Show confusion matrices for both MobileNetV2 and the Siamese model.

> **Note:** The evaluation page runs entirely in the browser. No Flask backend is required. If the page does not load correctly, ensure you are using a local HTTP server (not opening the HTML file directly).

**💡 For detailed training logs (loss and accuracy per epoch), open the browser's Developer Tools (F12) and go to the Console tab.**
