"use client"
import {Slider} from "@nextui-org/react";
import {useRef, useState} from "react";
import {fileUpload} from "../../../../utils/upload";
import {fireTask} from "../../../../utils/helpers"

export default function Img2Img({orgUser,startLoading, endLoading, isDisabled}) {
    const fileRef = useRef();
    const [count, setCount] = useState(1);
    const [similarity, setSimilarity] = useState(0.5);

    const handleOnImageInputChange = async (e) => {
        const blob = e.target.files[0];
        startLoading();
        const imageURL = await fileUpload("", blob.name, blob)
        console.log("orgUser", orgUser)
        await fireTask("img2img", orgUser.org_id, {
            count, refImage: imageURL, extraParams: {
                similarity
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

        <Slider
            size="md"
            step={0.1}
            classNames={{
                base: "max-w-md gap-3",
                track: "border-s-secondary-100",
                filler: "bg-gradient-to-r from-secondary-100 to-secondary-500"
            }}
            color="foreground"
            label="Similarity"
            showSteps={true}
            maxValue={1}
            minValue={0}
            defaultValue={0.6}
            className="max-w-md"
        />
        <Slider
            size="md"
            step={1}
            classNames={{
                base: "max-w-md gap-3 mt-2",
                track: "border-s-secondary-100",
                filler: "bg-gradient-to-r from-secondary-100 to-secondary-500"
            }}
            color="foreground"
            label="No. of images"
            showSteps={true}
            value={count}
            onChange={(e) => setCount(e)}
            maxValue={Math.min(4, orgUser?.org?.credits)}
            minValue={1}
            defaultValue={1}
            className="max-w-md"
        />

        <span className="flex my-2">{count * 1} credits will be used</span>

    </div>
)
}