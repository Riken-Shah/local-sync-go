"use client"
// import Image from 'next/image'
import { blurHashToDataURL } from "../utils.js";
import React, {useEffect, useRef, useState} from "react";

import {
  Image,
  Popover,
  Input,
  PopoverContent,
  Button,
  PopoverTrigger,
} from "@nextui-org/react";
import {  sendLog } from "../../../utils/firebase";
import {imageSearch} from "@/app/search";
import {useRouter} from "next/navigation";
import axios from "axios";


function photoURLToLocalURL(nasDrive, photoURL) {
  return photoURL.replace("/images/S:", `${nasDrive}:`)
}

function fetchImageWithHeaderUsingAxios(imageUrl) {
  const headers = {
    'ngrok-skip-browser-warning': 'true'
  };

  return axios
      .get(imageUrl, { headers, responseType: 'blob' })
      .then((response) => response.data)
      .catch((error) => {
        console.error('Error fetching image:', error);
        throw error;
      });
}

function CustomImage({imageAPI, thumbnail_url}) {
  const [isLoading, setIsLoading] = useState(true);
  const [blob,setBlob] = useState(null)

  useEffect(() => {
    fetchImageWithHeaderUsingAxios(`${imageAPI}${thumbnail_url}`).then((b) => {
      setBlob(URL.createObjectURL((b)))
      setIsLoading(false)
    } )

  }, [imageAPI]);

  return (
      <Image
          alt="Woman listing to music"
          className="object-cover mb-4"
          height={400}
          isLoading={isLoading}
          src={blob}
          width={400}
          loading="eager"
      />
  )
}


export function ImageGrid({ visibleImages, search, setVisibleImages, images, user, imageAPI, loadingModalOnOpen, updateTags, nasDrive}) {
  const router = useRouter()
  function  loadMoreImages  ()  {
    setVisibleImages((prevVisibleImages) => prevVisibleImages + 10);
    sendLog("more-images", {search})
  };

  const [updatedTags, setTags] = useState("")

  const performImageSearch = ((blob) => {
    loadingModalOnOpen()
    imageSearch(router, user.email, blob)
  })

  const showMoreRef = useRef()
  const oververOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 1.0
  }


  useEffect(() => {
    const observer = new IntersectionObserver( () =>   setVisibleImages((prevVisibleImages) => {
      sendLog("more-images", {search})

      return prevVisibleImages + 5
    }), oververOptions)
    if (showMoreRef.current) {
      observer.observe(showMoreRef.current)
    }
    return () => {
      if(showMoreRef.current) {
        observer.unobserve(showMoreRef.current)
      }
    }
  }, [showMoreRef]);

  return (
      <div>
    <div className="columns-2 gap-4 sm:columns-3 xl:columns-4 2xl:columns-5">
      {images &&
        images.slice(0, visibleImages).map(
          ({
            photo_url,
            thumbnail_url,
              manual_keywords,
              ext,
            //   photo_image_url,
            //   photo_aspect_ratio,
            //   photo_width,
            //   photo_height,
            //   blur_hash,
            //   photo_description,
            //   ai_description,
            similarity,
          }) => (
            <div className=" block mb-2 relative" key={photo_url}>

              <CustomImage thumbnail_url={thumbnail_url} imageAPI={imageAPI} />

              {/* // blured background */}
              <div className="absolute top-2 right-2 z-10">
                <Button
                  isIconOnly
                  color="black"
                  className="bg-gradient-to-tr from-pink-500 to-yellow-500"
                  variant="faded"
                  ariaLabel="Take a photo"
                  onClick={(e) => {
                    sendLog("img_2_img", {thumbnail_url})
                    e.preventDefault();
                    fetch(
                      `${imageAPI}${thumbnail_url}`,
                        {method: "POST"}
                    ).then((r) => {
                      r.blob().then((blob) => {
                        const splits =  thumbnail_url.split("\\")
                        blob.name = splits[splits.length - 1]
                        performImageSearch(blob);
                      });
                    });
                  }}
                >
                  <svg
                    height="512px"
                    id="Layer_1"
                    fill="white"
                    version="1.1"
                    viewBox="0 0 512 512"
                    width="512px"
                    xmlSpace="preserve"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                  >
                    <path d="M344.5,298c15-23.6,23.8-51.6,23.8-81.7c0-84.1-68.1-152.3-152.1-152.3C132.1,64,64,132.2,64,216.3  c0,84.1,68.1,152.3,152.1,152.3c30.5,0,58.9-9,82.7-24.4l6.9-4.8L414.3,448l33.7-34.3L339.5,305.1L344.5,298z M301.4,131.2  c22.7,22.7,35.2,52.9,35.2,85c0,32.1-12.5,62.3-35.2,85c-22.7,22.7-52.9,35.2-85,35.2c-32.1,0-62.3-12.5-85-35.2  c-22.7-22.7-35.2-52.9-35.2-85c0-32.1,12.5-62.3,35.2-85c22.7-22.7,52.9-35.2,85-35.2C248.5,96,278.7,108.5,301.4,131.2z" />
                  </svg>
                </Button>
              </div>

              <div className="absolute bottom-2 right-2 group-hover:visible ">
                <Popover placement="top" showArrow offset={10} classNames="">
                  <PopoverTrigger onClick={() => {sendLog("img_more_options", {thumbnail_url})}}>
                    <Button className="bg-gradient-to-tr from-pink-500 to-yellow-500">
                      More Options
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[240px]">
                    {(titleProps) => (
                      <div className="px-1 py-2 w-full">
                        <div className="mt-2 flex flex-col gap-2 w-full">
                          <Button
                            // defaultValue="100%"
                            // size="sm"
                            variant="bordered"
                            onPress={(e) =>   navigator.clipboard.writeText(photoURLToLocalURL(nasDrive, photo_url))}
                          >
                            Copy Path
                          </Button>
                          <Input
                              defaultValue={photoURLToLocalURL(nasDrive, photo_url)}
                              label="Path"
                              size="sm"
                              disabled
                              variant="bordered"
                          />
                          <Input
                            // defaultValue={tags === ""? manual_keywords: tags}
                            value={updatedTags === ""? manual_keywords: updatedTags}
                            label="Keywords"
                            size="sm"
                            variant="bordered"
                            onChange={(e) => setTags(e.target.value)}
                          />
                          <Input
                            defaultValue={ext}
                            label="File Format"
                            size="sm"
                            disabled
                            variant="bordered"
                          />
                       <Button variant="bordered" onPress={(e) => {
                            const tags = updatedTags.split(",")
                            tags.forEach((f) => f.trim())
                            updateTags(photo_url, tags.length ? tags.filter((f) => f !== "") : [])
                          }}> Save </Button>
                        </div>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )
        )}
    </div>
        {/*{images && images.length > visibleImages && (*/}
            <div className={`block text-center mt-2 mb-2 ${images && images.length > visibleImages ? "visible": "invisible"}`} ref={showMoreRef}>
              <Button  onClick={loadMoreImages}>Show More</Button>
            </div>
        {/*)}*/}
      </div>
  );
}
