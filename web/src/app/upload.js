import {
    getStorage,
    ref,
    getDownloadURL,
    uploadString,
} from "firebase/storage";
import {storage} from "./firebase"

async function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = _e => resolve(reader.result);
        reader.onerror = _e => reject(reader.error);
        reader.onabort = _e => reject(new Error("Read aborted"));
        reader.readAsDataURL(blob);
    });
}


export async function fileUpload(user_id, filename, blob) {
    const storageRef = ref(storage, `search/${user_id}/${filename}`);
    const dataURL = await blobToDataURL(blob)
    return new Promise((resolve, reject) => {
        uploadString(storageRef, dataURL, "data_url").then(
            (snapshot) => {
                getDownloadURL(snapshot.ref).then((downloadURL) => {
                    resolve(downloadURL);
                });
            }
        ).catch((error) => {
                reject(error);
            }
        );
    });
}

