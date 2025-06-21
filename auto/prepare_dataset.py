import os
# import numpy as np
from deepface import DeepFace
import logging
# import tensorflow as tf
import sys
import json
# Suppress TensorFlow messages
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
logging.getLogger("tensorflow").setLevel(logging.ERROR)

def get_face_embedding(image_path):
    """
    Generate the face embedding for a given image.
    
    Parameters:
    image_path (str): Path to the image file.
    
    Returns:
    np.array: The embedding of the face in the image.
    """
    try:
        result = DeepFace.represent(image_path, model_name="ArcFace", enforce_detection=False)
        embedding = result[0]["embedding"] if isinstance(result, list) else result["embedding"]
        # print(embedding)
        # return np.array(embedding)
        print(embedding)
        return embedding
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return None
    

if __name__ == "__main__":
    if len(sys.argv) > 1:
        image_path = sys.argv[1] # Get the first argument passed
        embedding = get_face_embedding(image_path)
        print(json.dumps(embedding))
    else:
        print("Error: No image path provided to the Python script.")
        sys.exit(1)
# image_path = "C:/Users/DELL/Downloads/expressproject/uploads/hus.jpg"    
# get_face_embedding(image_path)