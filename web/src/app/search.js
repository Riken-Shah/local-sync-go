import {fileUpload} from "../../utils/upload";

export function textSearch(router, prompt) {
    const param = new URLSearchParams()
    param.append("search", prompt)
    router.push("?" + param.toString())
}


export async function imageSearch(router, email, blob) {
    const imageURL = await fileUpload(email, blob.name, blob)
    const param = new URLSearchParams()
    param.append("search", imageURL)
    router.push("?" + param.toString())
}