import firebase_admin
from firebase_admin import credentials, db, storage, firestore
import requests
import json
import base64
import time  # Added for simulating delay

# Initialize Firebase Admin SDK
cred = credentials.Certificate("./firebase_admin.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://ai-folder-default-rtdb.firebaseio.com',
    'storageBucket': 'ai-folder.appspot.com'
})

# Reference to the Realtime Database
db_ref = db.reference('tasks')

# Reference to Firestore
firestore_db = firestore.client()

# Reference to Firebase Storage
bucket = storage.bucket()

def update_task_state(task_id, state):
    db_ref.child(task_id).update({'status': state})

def simulate_api_call():
    # Simulate API call with a delay
    print("Simulating API call...")
    time.sleep(1)  # Simulating a 1-second delay

    # Dummy response for testing
    return {
        'images': ['https://firebasestorage.googleapis.com/v0/b/ai-folder.appspot.com/o/search%2Frikenshah.02%40gmail.com%2F1639%20DM.jpg?alt=media&token=41ea01a3-3668-4d6a-87de-17567092ccd8',
                   'https://firebasestorage.googleapis.com/v0/b/ai-folder.appspot.com/o/search%2Frikenshah.02%40gmail.com%2F1639%20DM.jpg?alt=media&token=41ea01a3-3668-4d6a-87de-17567092ccd8']
    }

def upload_image(base64_string, firestore_id, index):
    # Decode the base64 string to get the image content
    img_blob = base64.b64decode(base64_string)

    img_filename = f"tasks/{firestore_id}/{index + 1}.jpg"
    blob = bucket.blob(img_filename)

    # Set mimetype to 'image/jpeg' (modify accordingly based on your image type)
    blob.upload_from_string(img_blob, content_type='image/png')

    # Set the ACL to make the image publicly accessible
    blob.acl.all().grant_read()
    blob.acl.save()

    return blob.public_url

def update_final_status_in_firestore(task_id, firestore_id, success):
    if firestore_id:
        # Assuming you have a 'tasks' collection in Firestore
        firestore_ref = firestore_db.collection('tasks').document(firestore_id)
        firestore_ref.update({'status': 'completed' if success else "failed"})

def deduct_credits(org_id, deducted_credits=1):
    if org_id:
        org_ref = firestore_db.collection('orgs').document(org_id)
        org_snapshot = org_ref.get()
        print("org", org_snapshot.to_dict())
        current_credits = org_snapshot.get("credits")
        new_credits = current_credits - deducted_credits
        org_ref.update({'credits': new_credits})

AUTOMATIC1111_URL = "https://11d2-34-123-151-87.ngrok-free.app/"

def text2img(firestore_id, prompt, negative_prompt, count, extra_params):
    headers = {'Content-Type': 'application/json'}
    payload ={
        "prompt": prompt,
        "sampler_name": "DPM++ 2M",
        "batch_size": count,
        "n_iter": 1,
        "steps": 10,
        "cfg_scale": 3.5,
        "width": 512,
        "height": 512,
        "restore_faces": True,
        "negative_prompt": negative_prompt,
        "send_images": True,
        "save_images": False,
    }

    response = requests.post(f'{AUTOMATIC1111_URL}sdapi/v1/txt2img', headers=headers,
                             data=json.dumps(payload), timeout=900)
    if response.status_code != 200:
        print("Failed to generate image with following error", response.json())
        raise Exception("Failed to generate image")

    images = response.json()['images']

    # Upload images to Firebase Storage
    img_urls = [upload_image(img_url, firestore_id, i) for i, img_url in enumerate(images)]
    return img_urls

def convert_img_to_base64(img_url):
    # Fetch the image content from the URL
    img_response = requests.get(img_url)

    if img_response.status_code == 200:
        # Convert the image content to base64
        base64_string = base64.b64encode(img_response.content).decode('utf-8')
        return base64_string
    else:
        # Handle the case where fetching the image failed
        raise Exception(f"Failed to fetch image from {img_url}. Status code: {img_response.status_code}")


def img2img(firestore_id, ref_image, prompt, negative_prompt, count, extra_params):
    headers = {'Content-Type': 'application/json'}
    payload ={
        "prompt": prompt,
        "sampler_name": "DPM++ 2M",
        "batch_size": count,
        "n_iter": 1,
        "steps": 80,
        "cfg_scale": 7,
        "init_images": [convert_img_to_base64(ref_image)],
        "width": 512,
        "height": 512,
        "restore_faces": True,
        "negative_prompt": negative_prompt,
        "denoising_strength": extra_params["similarity"],
        "send_images": True,
        "save_images": False,
    }

    response = requests.post(f'{AUTOMATIC1111_URL}sdapi/v1/img2img', headers=headers,
                             data=json.dumps(payload), timeout=900)
    if response.status_code != 200:
        print("Failed to generate image with following error", response.json())
        raise Exception("Failed to generate image")

    images = response.json()['images']

    # Upload images to Firebase Storage
    img_urls = [upload_image(img_url, firestore_id, i) for i, img_url in enumerate(images)]
    return img_urls

def upscale(firestore_id, ref_image, extra_params):
    headers = {'Content-Type': 'application/json'}
    payload = {
        "resize_mode": 0,
        "show_extras_results": "false",
        "gfpgan_visibility": 0,
        "codeformer_visibility": 0,
        "codeformer_weight": 0,
        "upscaling_resize": 2,
        # "upscaling_resize_w": 1024,
        # "upscaling_resize_h": 1024,
        "upscaling_crop": "true",
        "upscaler_1": "SwinIR_4x",
        "upscaler_2": "None",
        "extras_upscaler_2_visibility": 0,
        "upscale_first": "true",
        "image": convert_img_to_base64(ref_image)
    }

    response = requests.post(f'{AUTOMATIC1111_URL}sdapi/v1/extra-single-image', headers=headers,
                             data=json.dumps(payload), timeout=900)
    if response.status_code != 200:
        print("Failed to generate image with following error", response.json())
        raise Exception("Failed to generate image")

    image = response.json()['image']

    # Upload images to Firebase Storage
    img_urls = [upload_image(img_url, firestore_id, i) for i, img_url in enumerate([image])]
    return img_urls





def process_task(task_id, task):
    try:
        # Update task state to "processing"
        update_task_state(task_id, 'processing')
        print(f"Processing task {task_id}...", task)

        # Simulate API call
        # dummy_response = simulate_api_call()
        img_urls = []
        if task.get("type") == "text2img":
            img_urls = text2img(task.get("firestore_id"), task.get("prompt"), "blurry, low quality", task.get("count"), task.get("extra_params"))
        elif task.get("type") == "img2img":
            img_urls = img2img(task.get("firestore_id"), task.get("ref_image"), "floral", "blurry, low quality", task.get("count"), task.get("extra_params"))
        elif task.get("type") == "upscale":
            img_urls = upscale(task.get("firestore_id"), task.get("ref_image"), task.get("extra_params"))
        else:
            raise Exception("unsupported type")



        # Update Realtime Database with image links
        db_ref.child(task_id).child('results').set(img_urls)

        # Update final status in Firestore
        update_final_status_in_firestore(task_id, task.get("firestore_id"), True)

        # Deduct credits from /orgs/{org_id}
        deduct_credits(task.get("org_id"), task.get("credits"))

        print(f"Task {task_id} processed successfully.")
        update_task_state(task_id, 'completed')
    except Exception as e:
        print(f"Error processing task {task_id}: {e}")
        # Update task state to "error" if an error occurs
        update_task_state(task_id, 'failed')
        update_final_status_in_firestore(task_id, task.get("firestore_id"), False)

# Listen for changes in the /tasks node
def on_task_change(event):
    try:
        task_id, task = get_task_info_from_event(event)
        if task and "status" in task and task["status"] == "queued":
            process_task(task_id, task)
    except Exception as e:
        print(f"Error processing task change: {e}")

def get_task_info_from_event(event):
    if len(event.path) == 1:
        task_id = next(iter(event.data))
        task = event.data[task_id]
    else:
        task_id = event.path[1:]
        task = event.data

    return task_id, task

# Listen for changes in the /tasks node
tasks_stream = db_ref.listen(on_task_change)
