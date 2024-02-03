# coding: utf-8
import argparse
import configparser
from io import BytesIO
from pathlib import Path, PurePosixPath
import os

import numpy as np
import requests
from PIL import Image
from flask import Flask, Response, jsonify, request, send_from_directory
from flask_cors import CORS

from sync import SyncDir

IMAGES_PREFIX_URL = PurePosixPath('/images')
THUMBS_PREFIX_URL = PurePosixPath('/thumb')
MAX_TOP_N = 100
ROUND_NUM = 1_000_000


############ Helper functions ############

def round_float(x):
    # TODO: make round num work
    return float(x)  # round(x * ROUND_NUM) / ROUND_NUM)


def emb_to_list(emb):
    if emb.ndim == 2:
        assert emb.shape[0] == 1, 'Multidimension embedding: ' + str(emb.shape)
        emb = emb[0]

    return list(map(round_float, emb))


################ Flask app ###############


def add_routes(app):
    @app.route('/get-embedding', methods=['POST', 'GET'])
    def get_embedding():
        results = {}

        if request.method == 'POST':
            uploaded_files = request.files.getlist("fileToUpload[]")
            for file in uploaded_files:
                emb = SYNC_ENGINE.indexer.encode_image(Image.open(file.stream))
                results[file.filename] = emb_to_list(emb)
            results['_mean_'] = emb_to_list(np.mean(list(results.values()), 0))
        else:
            if 'prompt' in request.args:
                emb = SYNC_ENGINE.indexer.encode_prompt(request.args['prompt'])
                results = emb_to_list(emb)

            elif 'src_image' in request.args:
                src_image = Path(request.args['src_image']).relative_to(IMAGES_PREFIX_URL)

                if '..' not in str(src_image):
                    path_image = images_path / src_image
                    if path_image.exists():
                        emb = SYNC_ENGINE.indexer.encode_image(Image.open(path_image))
                        results = emb_to_list(emb)

        return jsonify(results)

    @app.route('/search', methods=['POST'])
    def do_the_magic():
        file_url = request.json.get('fileUrl', None)
        print("file_url", file_url)

        if file_url:
            # Download the file from the URL
            response = requests.get(file_url)
            if response.status_code == 200:
                image_bytes = BytesIO(response.content)
                emb = SYNC_ENGINE.indexer.encode_image(Image.open(image_bytes), normalize=True)
            else:
                return jsonify({"error": "Failed to download the file from the provided URL"}), 400
        else:
            text = request.json.get('text', '')
            emb = SYNC_ENGINE.indexer.encode_prompt(text, normalize=True)

        results = emb_to_list(emb)
        query = np.array(results, dtype=np.float32)[np.newaxis]

        print("Searching for: ", query)

        res = SYNC_ENGINE.milvus.search(query, 50)

        result_dict = []
        for hits_i, hits in enumerate(res):
            for hit_i, hit in enumerate(hits):
                pre_result_dict = {
                    "id": hit.entity.get('id'),
                    "photo_url": str(IMAGES_PREFIX_URL / hit.entity.get('fname')),
                    'thumbnail_url': str(IMAGES_PREFIX_URL / hit.entity.get('metadata')["thumbnail"]),
                    'similarity': hit.distance
                }

                result_dict.append(pre_result_dict)

        return jsonify(result_dict)

    @app.route(str(IMAGES_PREFIX_URL / '<path:path>'), methods=["GET", "POST"])
    def send_image(path):
        print("path for image", path.replace('C:/Users/Aadi/Desktop/riken/local-sync-go/',""))
        return send_from_directory("/Volumes/SSD/SyncEngine/",  path.replace('C:/Users/Aadi/Desktop/riken/',""))

    @app.route(str(THUMBS_PREFIX_URL / '<path:path>'))
    def send_thumb(path):
        return Response(SYNC_ENGINE.thumbnail(path), mimetype='image/jpeg')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-p', '--port', type=int, help='Port to start server', default=5000)
    parser.add_argument('-s', '--host', type=str, help='Host to start server', default='0.0.0.0')
    parser.add_argument('--dev', help='Start in dev mode', default=False, action='store_true')
    parser.add_argument("--json-file", help="Path to JSON file")
    parser.add_argument("--collection-name", help="Collection Name")
    parser.add_argument("--milvus-uri", help="Milvus URI")
    parser.add_argument("--milvus-username", help="Milvus Username")
    parser.add_argument("--milvus-password", help="Milvus Password")
    parser.add_argument("--cache-dir", help="Cache Dir", default="")
    parser.add_argument("--emb-dir", help="Emb Dir", required=False)
    args = parser.parse_args()
    # rotation_invariant = args.rotation_invariant

    cfp = configparser.RawConfigParser()
    # cfp.read("config.ini")
    # root_path = cfp.get("milvus", "root_path")
    # collection_name = cfp.get("milvus", "collection_name")
    # img_dir = cfp.get("milvus", "img_dir")

    app = Flask(
        __name__,
        static_folder=str("/Volumes/SSD/SyncEngine/.local/thumbnails3"),
        static_url_path="/static")


    @app.route('/', methods=['GET', 'POST'])
    def _proxy(*args, **kwargs):
        resp = requests.request(
            method=request.method,
            url=request.url.replace(request.host_url, 'http//localhost:8000'),
            headers={key: value for (key, value) in request.headers if key != 'Host'},
            data=request.get_data(),
            cookies=request.cookies,
            allow_redirects=False)
        excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
        headers = [(name, value) for (name, value) in resp.raw.headers.items()
                   if name.lower() not in excluded_headers]
        response = Response(resp.content, resp.status_code, headers)
        return response
    # root_path = os.getenv("ROOT_PATH", root_path)
    # collection_name = os.getenv("COLLECTION_NAME", collection_name)
    # img_dir = os.getenv("IMG_DIR", img_dir)

    # print("Root path: ", root_path)

    cache_dir = os.getenv("CACHE_DIR", "./.cache")
    SYNC_ENGINE = SyncDir("/Volumes/SSD/SyncEngine/.local/thumbnails3",
                          # args.emb_dir, args.json_file,
                          # collection_name=args.collection_name,
                         # cache_dir=args.cache_dir,
                         # milvus_uri=args.milvus_uri, milvus_username=args.milvus_username,
                         # milvus_password=args.milvus_password)
                          collection_name="mvp1",
                          cache_dir="/Volumes/SSD/SyncEngine/.cache",
                          milvus_uri="https://in03-4e728d395bbf9d3.api.gcp-us-west1.zillizcloud.com",
                          milvus_username="db_4e728d395bbf9d3",
                          milvus_password="hQ9$w9F4Q6FyQry",
                          embedding_folder="/Volumes/SSD/SyncEngine/.local/embds3",
                          json_file="")

    print(SYNC_ENGINE.milvus)
    # SYNC_ENGINE.register_sync()
    # CORS allow 3000
    CORS(app, resources={r"/*": {"origins": "*"}})
    add_routes(app)
    app.run(host=args.host, port=args.port, debug=args.dev)
