from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)

@app.route("/process-document", methods=["POST"])
def process_document():
    data = request.json
    file_name = data.get("fileName")
    file_type = data.get("fileType")
    download_url = data.get("downloadUrl")

    if not download_url:
        return jsonify({"error": "Missing download URL"}), 400

    # Download the file from Convex
    file_path = os.path.join("/tmp", file_name)
    r = requests.get(download_url)
    with open(file_path, "wb") as f:
        f.write(r.content)

    # TODO: Process with your function
    # result = process_insurance_query(file_path)

    return jsonify({
        "message": "File processed successfully",
        "fileName": file_name,
        "fileType": file_type,
        "savedAt": file_path,
        "processingResult": "Sample result here"
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
