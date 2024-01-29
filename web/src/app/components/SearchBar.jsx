
import {Image, Input} from "@nextui-org/react";
import {useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {textSearch, imageSearch} from "@/app/search";

export function SearchBar({ searchPrompt, setSearchPrompt, user, search, loadingModalOnOpen}) {

    const fileRef = useRef(null);
    const router = useRouter()



    const textOnChange = ((e) => {
        if (e.key === "Enter") {
            textSearch(router, searchPrompt)
        }
    });

    const imageInputOnChange = ((e) => {
        loadingModalOnOpen()
        imageSearch(router, user.email, e.target.files[0])
    })

    
    return (
      <div className="relative mb-4 flex justify-center items-center w-full">
        <Input
          type="search"
          value={searchPrompt}
          onChange={(e) => setSearchPrompt(e.target.value)}
          placeholder={`Search for "red flowers", "white leaf", "black background"`}
          onKeyUp={textOnChange}

        />
        <div className="absolute inset-y-0 right-5 flex items-center pr-3 cursor-pointer overflow-hidden mb-2 mt-2 rounded" onClick={() => {
            fileRef.current.click();
        }}>
            {search && search.startsWith("http") ?     <Image
                alt="Woman listing to music"
                className="object-cover mb-4"
                src={search}
                width={80}
                loading="eager"
            />: <svg

            id="Layer_1"
            version="1.1"
            viewBox="0 0 64 64"
            xmlSpace="preserve"
            width={50}
            fill="white"
            height={50}
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
          >
            <g>
              <g id="Icon-Image" transform="translate(278.000000, 232.000000)">
                <path
                  className="st0"
                  d="M-226.2-181.6h-39.5c-2.3,0-4.2-1.9-4.2-4.2v-28.2c0-2.3,1.9-4.2,4.2-4.2h39.5     c2.3,0,4.2,1.9,4.2,4.2v28.2C-222-183.5-223.9-181.6-226.2-181.6L-226.2-181.6z M-265.8-215.5c-0.8,0-1.4,0.6-1.4,1.4v28.2     c0,0.8,0.6,1.4,1.4,1.4h39.5c0.8,0,1.4-0.6,1.4-1.4v-28.2c0-0.8-0.6-1.4-1.4-1.4H-265.8L-265.8-215.5z"
                  id="Fill-12"
                />
                <path
                  className="st0"
                  d="M-238.9-201.5c-3.1,0-5.5-2.5-5.5-5.5s2.5-5.5,5.5-5.5s5.5,2.5,5.5,5.5     S-235.9-201.5-238.9-201.5L-238.9-201.5z M-238.9-210c-1.6,0-2.9,1.3-2.9,2.9c0,1.6,1.3,2.9,2.9,2.9c1.6,0,2.9-1.3,2.9-2.9     C-236-208.7-237.3-210-238.9-210L-238.9-210z"
                  id="Fill-13"
                />
                <polyline
                  className="st0"
                  id="Fill-14"
                  points="-231.4,-182.1 -254.5,-203.8 -267.7,-191.6 -269.5,-193.5 -254.5,-207.4 -229.6,-184      -231.4,-182.1    "
                />
                <polyline
                  className="st0"
                  id="Fill-15"
                  points="-224.2,-189.3 -231.9,-195.5 -238.3,-190.2 -240,-192.3 -231.9,-198.9 -222.6,-191.3      -224.2,-189.3    "
                />
              </g>
            </g>
          </svg>}
            <input ref={fileRef} className="hidden" type="file" accept="image/*" onChange={imageInputOnChange} />
        </div>
      </div>
    );
}