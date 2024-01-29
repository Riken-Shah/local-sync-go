"use client";

import React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import {setUserId } from "firebase/analytics";
import {analytics, auth, sendLog, toggleAnalytics} from "./firebase"

import { SearchBar } from "./components/SearchBar";
import { ImageGrid } from "./components/ImageGrid";
import axios from "axios";
import _ from "lodash";
import {SettingIcon} from "@/app/components/SettingIcon";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Input, CircularProgress
} from "@nextui-org/react";
import { onAuthStateChanged } from "firebase/auth";
import {fileUpload} from "./upload"
import Auth from "@/app/components/Auth";




export default function Home() {
  // Application state
  const [result, setResult] = useState(null);
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const {isOpen: authModelOpen, onOpen: authModelOnOpen} = useDisclosure();
  const {isOpen: loadingModelOpen, onOpen: loadingModelOnOpen, onClose: loadingModelOnClose} = useDisclosure();

  const [inferenceAPI, setInferenceAPI] = useState("");
  const [imageAPI, setImageAPI] = useState("");
  const [user, setUser]= useState(null)

  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setValue((v) => (v >= 100 ? 0 : v + 10));
    }, 500);

    return () => clearInterval(interval);
  }, []);


  useEffect(()=>{
    onAuthStateChanged(getAuth(), (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        setUser(user)
        const devUsers = ["rikenshah.02@gmail.com", "rikenshah2002@gmail.com"]
        // Toggle analytics is the user is not dev
        toggleAnalytics(!devUsers.includes(user.email))
      } else {
        authModelOnOpen()
        // User is signed out
        // ...
        console.log("user is logged out")
      }
    });

  }, [])
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      let inferenceAPI = localStorage.getItem('inferenceAPI');
      let imageAPI = localStorage.getItem('imageAPI');

      setInferenceAPI(inferenceAPI);
      setImageAPI(imageAPI);

      const localAPI = "https://pf18ik-ip-122-187-218-226.tunnelmole.net"
      // if(!inferenceAPI)
      setInferenceAPI(localAPI)
      // if(!imageAPI)
      setImageAPI(localAPI)
    }
  }, []);


  const handleReset = () => {
    localStorage.clear()
    auth.signOut()
    location.reload()
  }

  function loadImage(selectedFile) {
    const reader = new FileReader();

    reader.onload = function (event) {
      let imgObject = {};
      imgObject.src = event.target.result;
    };

    reader.readAsDataURL(selectedFile);
  }

  async function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = _e => resolve(reader.result);
      reader.onerror = _e => reject(reader.error);
      reader.onabort = _e => reject(new Error("Read aborted"));
      reader.readAsDataURL(blob);
    });
  }


  const search = async ({
    text,
    files,
                          inferenceAPI,
  }) => {
    try {
      setResult(null);
      setVisibleImages(setupDefaultVisibleImages())
      loadingModelOnOpen()
      if (text) {
        const resp = await axios.post(
            inferenceAPI + "/search",
            {
              text,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
        );

        setResult(resp.data);
        sendLog("text_search", {text, results_count: resp?.data?.length})      } else if (files?.length) {
        const acceptedFiles = files;
        let i =0
          const file = acceptedFiles[i];
          const dataURL = await blobToDataURL(file)
          const downloadURL = await fileUpload(user.email, file.name, dataURL)
          console.log("download url", downloadURL, file)

        const resp = await axios.post(inferenceAPI + "/search", JSON.stringify({"fileUrl": downloadURL}), {
          headers: {
            "Content-Type": "application/json",
          },
        });
        setResult(resp.data);
        sendLog("img_search", {image_url: downloadURL, results_count: resp?.data?.length})
      }
    } catch (e) {
      console.log("something went wrong for img search err: ", e)
      alert("Something went wrong!")
    }finally {
      loadingModelOnClose()
    }
  };

  console.log(inferenceAPI, imageAPI)

  // const throttledSearch = useCallback(
  //   _.throttle(search, 1500, { leading: false }),
  //   []
  // );
  function setupDefaultVisibleImages() {
    const isDesktop = window.innerWidth >= 1024;
    return isDesktop ? 20 : 6;
  }
  const throttledSearch = search

  const [visibleImages, setVisibleImages] = useState(10);

  return (
    <main className="mx-auto max-w-[1960px] p-4 relative">
      {/* <Modal currentImage={currentImage} setCurrentImage={setCurrentImage} /> */}
      <div className="flex w-full items-center">
      <SearchBar search={throttledSearch}  inferenceAPI={inferenceAPI} imageAPI={imageAPI} />
        <Button className="m-2 mb-6" isIconOnly color="warning" variant="faded" aria-label="Take a photo"  onPress={onOpen}>
          <SettingIcon />
        </Button>
      </div>

      <ImageGrid visibleImages={visibleImages} setVisibleImages={setVisibleImages} images={result} search={throttledSearch} inferenceAPI={inferenceAPI} imageAPI={imageAPI} />

      {/* Auth Modal */}
      <Modal isOpen={authModelOpen} onOpenChange={authModelOnOpen} backdrop={"blur"}>
        <ModalContent>
          {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">Login to continue</ModalHeader>
                <ModalBody>
                  <div className="bg-white p-10 rounded-lg block">
            <span className="text-black text-2l">
              Please Sign In to Continue
            </span>
                    <Auth/>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Close
                  </Button>
                </ModalFooter>
              </>
          )}
        </ModalContent>
      </Modal>
      {/* Settings Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
        <ModalContent>
          {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">Settings</ModalHeader>
                <ModalBody>
                  <Input
                      isRequired
                      type="text"
                      label="Backend API"
                      value={inferenceAPI}
                      onChange={(e) => {
                        setInferenceAPI(e.target.value)
                        localStorage.setItem("inferenceAPI", e.target.value)
                      }}
                      // className="ma"
                  />
                  <Input
                      isRequired
                      type="text"
                      label="Image API"
                      value={imageAPI}
                      onChange={(e) => {
                        setImageAPI(e.target.value)
                        localStorage.setItem("imageAPI", e.target.value)
                      }}
                      // className="max-w-xs"
                  />


                  <Input
                      isRequired
                      type="text"
                      label="User ID"
                      value={user.uid}
                      disabled
                      // className="max-w-xs"
                  />

                  <Button color="danger" onPress={handleReset}>
                    Reset Everything
                  </Button>

                  <Button color="warning" onPress={auth.signOut}>
                    Logout
                  </Button>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Close
                  </Button>
                </ModalFooter>
              </>
          )}
        </ModalContent>
      </Modal>
      {/*Loading Modal*/}
      <Modal isOpen={loadingModelOpen} onOpenChange={loadingModelOnOpen} backdrop={"blur"} placement={"top-center"}>
        <ModalContent>
          {(onClose) => (
              <>
                {/*<ModalHeader className="flex flex-col gap-1">Login to continue</ModalHeader>*/}
                <ModalBody>
                  <CircularProgress
                      aria-label="Loading..."
                      size="lg"
                      value={value}
                      color="warning"
                      showValueLabel={true}
                  />
                </ModalBody>

              </>
          )}
        </ModalContent>
      </Modal>
    </main>
  );
}
