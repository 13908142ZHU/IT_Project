from flask import Flask, render_template, request, redirect, url_for, send_from_directory
import sqlite3
import os
from werkzeug.utils import secure_filename
from matching import calculate_text_score, should_display

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

DATABASE = "items.db"

    #Create/connect to the database
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def build_keywords_from_form(form):
    """
    Combine all user inputs into a keyword string
    First: Collect all imput keywords into one list. If not, user empty string
    """
    parts = [
        form.get("color", "").strip(),
        form.get("item_type", "").strip(),
        form.get("possible_location", "").strip(),
        form.get("brand", "").strip(),
    ]

    # Second: Process tags that users choose
    selected_tags = form.get("selected_tags", "").strip()
    if selected_tags:
        parts.extend(tag.strip() for tag in selected_tags.split(",") if tag.strip())

    # Third: Deduplication
    seen = set()
    cleaned = []
    for part in parts:
        key = part.lower()# Switch to lowercase to dedulicate
        if part and key not in seen:
            seen.add(key)
            cleaned.append(part)

    return ", ".join(cleaned)#Join with commas and return

# Highlight matched keywords
def highlight_keywords(item_keywords, search_terms):
    if not item_keywords:
        return ""

    # Split keyword string into lists
    parts = [k.strip() for k in item_keywords.split(",")]
    highlighted = []

    for part in parts:
        # If current keywords is in searching keywords, then highlight them
        if part.lower() in search_terms:
            highlighted.append(f'<span class="matched-keyword">{part}</span>')
        else:
            highlighted.append(part)

    return ", ".join(highlighted)

#Page Route
@app.route("/")
def home():
    return render_template("home.html")


@app.route("/post")
def post_page():
    return render_template("post.html")


@app.route("/search")
def search_page():
    return render_template("search.html")


@app.route("/post_success")
def post_success():
    return render_template("post_success.html")


@app.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

# Form Route
@app.route("/submit_post", methods=["POST"])
def submit_post():
    #Get form data
    title = request.form.get("title", "").strip()
    description = request.form.get("description", "").strip()
    keywords = build_keywords_from_form(request.form)
    contact = request.form.get("contact", "").strip()
    image = request.files.get("image")

    if not title or not image or image.filename == " ":
        return "Title and image are required."

    # Store the images and prevent filename attack
    filename = secure_filename(image.filename)
    save_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    image.save(save_path)

    conn = get_db_connection()
    conn.execute(
        """
        INSERT INTO items (mode, title, description, keywords, contact, image_path)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        ("post", title, description, keywords, contact, save_path)
    )
    conn.commit()
    conn.close()

    return redirect(url_for("post_success"))


@app.route("/do_search", methods=["POST"])

def do_search():
    # Get form data
    description = request.form.get("description", "").strip()
    keywords = build_keywords_from_form(request.form)
    contact = request.form.get("contact", "").strip()
    image = request.files.get("image")

    #Store upload images when searching
    search_image_path = ""
    if image and image.filename != "":
        filename = secure_filename("search_" + image.filename)
        search_image_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        image.save(search_image_path)

    search_terms = []

    if description:
        search_terms.extend(
            w.strip().lower()
            for w in description.replace(",", " ").split()
            if w.strip()
        )

    if keywords:
        search_terms.extend(
            w.strip().lower()
            for w in keywords.replace(",", " ").split()
            if w.strip()
        )

    search_terms = list(set(search_terms))

    #Determine the search type
    has_query_image = bool(search_image_path)#whether upload images
    has_query_text = bool(description or keywords)#whether input text

    #Caulculate matching scores
    conn = get_db_connection()
    items = conn.execute("SELECT * FROM items").fetchall()

    matched_items = []

    for item in items:
        #text
        text_score = calculate_text_score(
            description,
            keywords,
            item["description"],
            item["keywords"]
        )

        item_data = {
            "id": item["id"],
            "title": item["title"],
            "description": item["description"],
            "keywords": item["keywords"],
            "highlighted_keywords": highlight_keywords(item["keywords"], search_terms),
            "contact": item["contact"],
            "image_path": item["image_path"],
            "score": text_score,
            "text_score": text_score,
        }

        #Only image
        if has_query_image and not has_query_text:
            item_data["score"] = 0.0
            item_data["text_score"] = 0.0
            matched_items.append(item_data)

        #Both images and text
        elif has_query_image and has_query_text:
            matched_items.append(item_data)

        # Only text
        else:
            if should_display(text_score):
                matched_items.append(item_data)

    # Sorting
    if not has_query_image:
        matched_items.sort(key=lambda x: x["score"], reverse=True)

    #Generate URL of sarching images
    search_image_url = ""
    if search_image_path:
        search_image_url = url_for("uploaded_file", filename=os.path.basename(search_image_path))

    conn.close()

    return render_template(
        "result.html",
        results=matched_items,
        original_description=description,
        original_keywords=keywords,
        original_contact=contact,
        search_terms=search_terms,
        search_image_url=search_image_url,
        has_query_image=has_query_image,
        has_query_text=has_query_text
    )


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5050)