import {Button, Input, Slider} from "@nextui-org/react";
import TextHelper from "@/app/gen/components/TextHelpers";
import {useState} from "react";
import {set} from "firebase/database";
import {fireTask} from "../../../../utils/helpers";

export default function Text2Img({isDisabled, styles, orgUser}) {
    const [searchPrompt, setSearchPrompt] = useState("");
    const [count, setCount] = useState(1);
    const [extraParams, setExtraParams] = useState({});

    const   submitRequest= async() => {
        await fireTask("text2img", orgUser.org_id, {
            count, prompt: searchPrompt, extraParams: {
                ...extraParams
            }
        });
    }


    return (
        <div>
        <div className="flex items-center justify-center">
            <Input
                type="search"
                className="mt-3 mb-3 mr-3"
                disabled={isDisabled}
                value={searchPrompt}
                onChange={(e) => setSearchPrompt(e.target.value)}
                placeholder={`Generate for "red flowers", "white leaf", "black background"`}
                // onKeyUp={textOnChange}
            />
            <Button color="primary" isDisabled={isDisabled} onPress={submitRequest}>
                Generate
            </Button></div>
    <TextHelper styles={styles} orgUser={orgUser} setExtraParams={setExtraParams}/>
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
        </div>)
}