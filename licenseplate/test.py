import os
import cv2
import numpy as np
import matplotlib.pyplot as plt
from ultralytics import YOLO  
import sys 
import json
# 🔹 Fix OpenMP runtime conflict
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["OMP_NUM_THREADS"] = "1"

# 🔹 Disable OpenCV multithreading
cv2.setNumThreads(0)

# ==============================
# 📌 Load Trained Models
# ==============================
plate_detector = YOLO("C:/Users/DELL/Downloads/expressproject/licenseplate/best.pt")  # License plate detection model
char_classifier = YOLO("C:/Users/DELL/Downloads/expressproject/licenseplate/last.pt")  # Character classification model
# ==============================
# 📌 Character Mapping
# ==============================
class_to_arabic = {
    '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤', '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩',
    '7aa': 'ح', 'alf': 'ا', 'baa': 'ب', 'daad': 'ض', 'dal': 'د', 'ein': 'ع', 'faa': 'ف', 'gem': 'ج', 
    'haa': 'ه', 'kaff': 'ك', 'lam': 'ل', 'meem': 'م', 'noon': 'ن', 'qaf': 'ق', 'raa': 'ر', 'sadd': 'ص', 
    'seen': 'س', 'taa': 'ط', 'waw': 'و', 'yea': 'ي', 'zal': 'ذ', 'zay': 'ز'
}

# ==============================
# 📌 Image Enhancement Function
# ==============================
def enhance_image(plate_img):
    gray = cv2.cvtColor(plate_img, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    sharpening_kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    sharpened = cv2.filter2D(enhanced, -1, sharpening_kernel)
    denoised = cv2.bilateralFilter(sharpened, d=9, sigmaColor=75, sigmaSpace=75)
    return denoised

# ==============================
# 📌 Detect License Plate
# ==============================
def detect_license_plate(image_path):
    img = cv2.imread(image_path)
    results = plate_detector(image_path)
    detected_plates = [(int(x_min), int(y_min), int(x_max), int(y_max))
                        for result in results for x_min, y_min, x_max, y_max in result.boxes.xyxy]
    if not detected_plates:
        print("❌ No license plate detected.")
        return None, None
    x_min, y_min, x_max, y_max = detected_plates[0]
    padding = 5
    x_min, y_min = max(0, x_min - padding), max(0, y_min - padding)
    x_max, y_max = min(img.shape[1], x_max + padding), min(img.shape[0], y_max + padding)
    plate_img = img[y_min:y_max, x_min:x_max]
    return plate_img, (x_min, y_min, x_max, y_max)

# ==============================
# 📌 Detect and Sort Characters
# ==============================
def detect_characters(plate_img):
    temp_plate_path = "temp_plate.jpg"
    cv2.imwrite(temp_plate_path, plate_img)
    results = char_classifier(temp_plate_path)
    characters = []
    for result in results:
        for idx, box in enumerate(result.boxes.xyxy):
            x_min, y_min, x_max, y_max = map(int, box)
            class_index = int(result.boxes.cls[idx].item())
            class_label = result.names[class_index]
            arabic_char = class_to_arabic.get(class_label, class_label)  # Map to Arabic
            characters.append((x_min, y_min, x_max, y_max, arabic_char))
    if not characters:
        print("❌ No characters detected.")
        return ""
    
    # Sort numbers left to right and letters right to left
    numbers = sorted([c for c in characters if c[4].isdigit()], key=lambda x: x[0])
    letters = sorted([c for c in characters if not c[4].isdigit()], key=lambda x: x[0], reverse=True)
    plate_string = " ".join([c[4] for c in numbers + letters[::-1]])
    return plate_string

# ==============================
# 📌 Main Execution
# ==============================
def main3(image_path):
    if not os.path.exists(image_path):
        print(f"❌ Error: Image file '{image_path}' not found!")
        return ""

    plate_img, bbox = detect_license_plate(image_path)
    if plate_img is None:
        return ""

    enhanced_plate = enhance_image(plate_img)
    plt.figure(figsize=(10, 5))
    plt.subplot(1, 2, 1)
    plt.imshow(cv2.cvtColor(plate_img, cv2.COLOR_BGR2RGB))
    plt.axis("off")
    plt.title("Detected License Plate")

    plt.subplot(1, 2, 2)
    plt.imshow(enhanced_plate, cmap="gray")
    plt.axis("off")
    plt.title("Enhanced License Plate")
    plt.show()

    plate_string = detect_characters(plate_img)
    print(f"🔹 Detected License Plate Text: {plate_string}")
    return plate_string

# ==============================
# Run the Script with an Image
# ==============================
if __name__ == "__main__":
    if len(sys.argv) > 1:
        image_path = sys.argv[1] # Get the first argument passed
        plate_text = main3(image_path)
        print(json.dumps(plate_text))
    else:
        print("Error: No image path provided to the Python script.")
        sys.exit(1)




# image_path = r"C:/Users/DELL/Downloads/expressproject/licenseplate/3.jpg"
# plate_text = main3(image_path)

#  ٣ ٢ ٣ ٧ ج ا د
