"use client"
import {Slider} from "@nextui-org/react";
import {useRef, useState} from "react";
import {fileUpload} from "../../../../utils/upload";
import {fireTask} from "../../../../utils/helpers"

export default function Upscale({orgUser,startLoading, endLoading, isDisabled}) {
    const fileRef = useRef();

    const handleOnImageInputChange = async (e) => {
        const blob = e.target.files[0];
        startLoading();
        const imageURL = await fileUpload("", blob.name, blob)
        await fireTask("upscale", orgUser.org_id, {
            count: 1, refImage: imageURL, extraParams: {

            }
        });
        endLoading();
    };

return (
    <div className="flex flex-col items-center">
        <div>
            <input
                ref={fileRef}
                className="p-4 border border-gray-300 rounded-md shadow-md mb-4"
                type="file"
                accept="image/*"
                disabled={isDisabled}
                onChange={handleOnImageInputChange}
            />
        </div>
        <span className="flex my-2">{1} credits will be used</span>


    </div>
)
}