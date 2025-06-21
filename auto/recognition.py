import cv2
import numpy as np
from deepface import DeepFace
from ultralytics import YOLO
import json
import sys

def recognize_faces(image_path, users):
    # Load YOLO model (face detection model)
    yolo_model = YOLO("C:/Users/DELL/Downloads/expressproject/auto/models/yolov11m-face.pt")
    
    # Load stored face embeddings
    # face_db = np.load(face_db_path, allow_pickle=True)
    
    # Function to compute Cosine Similarity between two vectors
    def cosine_similarity(vec1, vec2):
        dot_product = np.dot(vec1, vec2)
        norm_vec1 = np.linalg.norm(vec1)
        norm_vec2 = np.linalg.norm(vec2)
        return dot_product / (norm_vec1 * norm_vec2)
    
    image = cv2.imread(image_path)
    
    # Perform YOLO face detection
    results = yolo_model.predict(
        conf=0.25,
        imgsz=1280,
        line_width=1,
        max_det=1000,
        source=image_path
    )
    detected_faces = results[0].boxes if results else []
    
    threshold = 0.3
    recognized_faces = {}
    all_detected_faces = []
    dict = {}
    
    for box in detected_faces:
        x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
        face_image = image[y1:y2, x1:x2]
        all_detected_faces.append((x1, y1, x2, y2))
        
        try:
            face_image_rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
            result = DeepFace.represent(face_image_rgb, model_name="ArcFace", enforce_detection=False)
            input_embedding = result[0]["embedding"] if isinstance(result, list) else result["embedding"]

            best_match = None
            best_similarity = 0
            best_match_id = None
            for entry in users:
                # arr = np.fromstring(entry.encodedImageData.strip('[]'), sep=', ')
                # arr2 = ast.literal_eval(entry.encodedImageData)
                
                # Convert string to list of floats
                # Remove the square brackets and split the string into elements
                s = entry['encodedimagedata']
                # Remove the square brackets
                # s_clean = s.strip("[]")
                # s_clean = s_clean.replace(',', '')
                # Split the string by whitespace and convert each substring to a float
                # arr = np.array([float(num) for num in s_clean.split()])
                # print(arr,type(arr))
                # print("s",s)
                # print("input_embedding",input_embedding)
                similarity = cosine_similarity(s, input_embedding)
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_match = entry['firstname'] + " " + entry['lastname']
                    best_match_id = entry['id']

            if best_match and best_similarity > threshold:
                if best_match in recognized_faces:
                    if recognized_faces[best_match]["similarity"] < best_similarity:
                        recognized_faces[best_match] = {"box": (x1, y1, x2, y2), "similarity": best_similarity}
                        dict[best_match_id] = best_match
                        print(best_match)
                else:
                    recognized_faces[best_match] = {"box": (x1, y1, x2, y2), "similarity": best_similarity}
                    dict[best_match_id] = best_match
        except Exception as e:
            print(f"Error in DeepFace recognition: {e}")
    
    # Draw recognized faces
    recognized_boxes = set()
    for name, data in recognized_faces.items():
        x1, y1, x2, y2 = data["box"]
        recognized_boxes.add((x1, y1, x2, y2))
        color = (0, 255, 0)
        cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)
        cv2.putText(image, name, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
    
    # Draw unrecognized faces
    for (x1, y1, x2, y2) in all_detected_faces:
        if (x1, y1, x2, y2) not in recognized_boxes:
            color = (0, 0, 255)  # Red color for unrecognized faces
            cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)
            cv2.putText(image, ".", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
    
    # cv2.imshow("Face Recognition", image)
    # cv2.waitKey(0)
    # cv2.destroyAllWindows()
    cv2.imwrite("C:/Users/Ali/OneDrive - Faculty of Engineering Ain Shams University/Desktop/smart/auto/output_with_faces_v3.jpg", image)
    
    return dict

if __name__ == "__main__":
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        users_json_str = sys.stdin.read()
        users = json.loads(users_json_str)
        result = recognize_faces(image_path, users)
        print(json.dumps(result))
        # Output results - each print will be a 'message' event in Node.js
        if isinstance(result, list):
            for result_line in result:
                print(result_line)
        elif result is not None: # If it's a single string or other printable
            print(result)
        else:
            print("Python: No specific recognition result to output.")
    else:
        print("Error: No image path or users provided to the Python script.")
        sys.exit(1)

# Example usage
# matched_users, num_matched = recognize_faces("D:/Yosry/Studies/College/9th semester/GP/Code/Test1/test4.jpg", "face_embeddings.npy")
# print(matched_users, num_matched)