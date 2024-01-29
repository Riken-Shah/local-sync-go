import {
    getStorage,
    ref,
    getDownloadURL,
    uploadString,
} from "firebase/storage";
import {storage} from "./firebase"

export function fileUpload(user_id, filename, data_url) {
    const storageRef = ref(storage, `search/${user_id}/${filename}`);

    return new Promise((resolve, reject) => {
        uploadString(storageRef, data_url, "data_url").then(
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