"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {  auth, sendLog, toggleAnalytics } from "./firebase";
import { SearchBar } from "./components/SearchBar";
import { ImageGrid } from "./components/ImageGrid";
import axios from "axios";
import { SettingIcon } from "@/app/components/SettingIcon";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
    Input,
    CircularProgress,
} from "@nextui-org/react";
import { useRouter, useSearchParams } from "next/navigation";

function isValidURL(string) {
    const res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    return res !== null;
}

function setupDefaultVisibleImages() {
    const isDesktop = window.innerWidth >= 1024;
    return isDesktop ? 20 : 6;
}


async function performSearch(inferenceAPI, search, setResult, loadingModelOnOpen, loadingModelOnClose) {
    const type = isValidURL(search) ? "image" : "text";
    const body = {
        [type === "text" ? "text" : "fileUrl"]: search,
    };

    const headers = {
        "Content-Type": "application/json",
    };

    try {
        loadingModelOnOpen();
        const response = await axios.post(inferenceAPI + "/search", JSON.stringify(body), { headers });

        if (response.status === 200) {
            setResult(response.data);
        } else {
            console.log("Something went wrong in search call:", response.data);
        }
    } catch (error) {
        console.log("Error in search call:", error);
    } finally {
        loadingModelOnClose();
    }
}

function Home() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const search = searchParams.get("search");

    const [result, setResult] = useState(null);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { isOpen: authModelOpen, onOpen: authModelOnOpen } = useDisclosure();
    const { isOpen: loadingModelOpen, onOpen: loadingModelOnOpen, onClose: loadingModelOnClose } = useDisclosure();

    const [inferenceAPI, setInferenceAPI] = useState("");
    const [imageAPI, setImageAPI] = useState("");
    const [user, setUser] = useState(null);

    const [value, setValue] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setValue((v) => (v >= 100 ? 0 : v + 10));
        }, 500);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (search !== null && inferenceAPI) {
            setVisibleImages(setupDefaultVisibleImages())
            performSearch(inferenceAPI, search, setResult, loadingModelOnOpen, loadingModelOnClose);
        }
    }, [search, inferenceAPI]);

    useEffect(() => {
        onAuthStateChanged(getAuth(), (user) => {
            if (user) {
                setUser(user);
                const devUsers = ["rikenshah.02@gmail.com", "rikenshah2002@gmail.com"];
                toggleAnalytics(!devUsers.includes(user.email));
            } else {
                authModelOnOpen();
                console.log("User is logged out");
            }
        });
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            let inferenceAPI = localStorage.getItem('inferenceAPI') || "https://pf18ik-ip-122-187-218-226.tunnelmole.net";
            let imageAPI = localStorage.getItem('imageAPI') || "https://pf18ik-ip-122-187-218-226.tunnelmole.net";

            setInferenceAPI(inferenceAPI);
            setImageAPI(imageAPI);
        }
    }, []);

    const handleReset = () => {
        localStorage.clear();
        auth.signOut();
        location.reload();
    };



    const [visibleImages, setVisibleImages] = useState(10);

    return (
        <main className="mx-auto max-w-[1960px] p-4 relative">
            <div className="flex w-full items-center">
                <SearchBar user={user} imageAPI={imageAPI} loadingModalOnOpen={loadingModelOnOpen} />
                <Button className="m-2 mb-6" isIconOnly color="warning" variant="faded" aria-label="Take a photo" onPress={onOpen}>
                    <SettingIcon />
                </Button>
            </div>

            <ImageGrid user={user} loadingModalOnOpen={loadingModelOnOpen} visibleImages={visibleImages} setVisibleImages={setVisibleImages} images={result} imageAPI={imageAPI} />

            {/* Auth Modal */}
            <Modal isOpen={authModelOpen} onOpenChange={authModelOnOpen} backdrop={"blur"}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Login to continue</ModalHeader>
                            <ModalBody>
                                <div className="bg-white p-10 rounded-lg block">
                                    <span className="text-black text-2l">Please Sign In to Continue</span>
                                    <Auth />
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
                                        setInferenceAPI(e.target.value);
                                        localStorage.setItem("inferenceAPI", e.target.value);
                                    }}
                                />
                                <Input
                                    isRequired
                                    type="text"
                                    label="Image API"
                                    value={imageAPI}
                                    onChange={(e) => {
                                        setImageAPI(e.target.value);
                                        localStorage.setItem("imageAPI", e.target.value);
                                    }}
                                />
                                <Input
                                    isRequired
                                    type="text"
                                    label="User ID"
                                    value={user?.uid || ""}
                                    disabled
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

            {/* Loading Modal */}
            <Modal isOpen={loadingModelOpen} onOpenChange={loadingModelOnOpen} backdrop={"blur"} placement={"top-center"}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalBody>
                                <CircularProgress aria-label="Loading..." size="lg" value={value} color="warning" showValueLabel={true} />
                            </ModalBody>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </main>
    );
}

export default Home;
