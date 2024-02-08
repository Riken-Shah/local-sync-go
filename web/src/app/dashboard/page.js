"use client"
import {getAuth, onAuthStateChanged} from "firebase/auth";
import {toggleAnalytics} from "../../../utils/firebase";
import {useEffect, useState} from "react";
import UserList from "@/app/dashboard/components/Table";
import {
    Button,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    useDisclosure
} from "@nextui-org/react";
import Auth from "@/app/components/Auth";
import {getAllOrgUsers, getOrgUser, getRoles} from "../../../utils/helpers";
import InsufficientModal from "@/app/components/InsufficientModal";


function Dashboard() {
    const [user, setUser] = useState()
    const [orgUser, setOrgUser] = useState();
    const { isOpen: authModelOpen, onOpen: authModelOnOpen } = useDisclosure();
    const [usersList, setUsersList] = useState([])
    const [roleMap, setRoleMap] = useState({})


    useEffect(() => {
        onAuthStateChanged(getAuth(), (user) => {
            if (user) {
                setUser(user);
                console.log(user.uid)
                const devUsers = ["rikenshah.02@gmail.com", "rikenshah2002@gmail.com"];
                toggleAnalytics(!devUsers.includes(user.email));

                (async function () {
                    const orgUserExists = await getOrgUser()
                    console.log(orgUserExists)
                    setOrgUser(orgUserExists)
                    const users = await getAllOrgUsers(orgUserExists.org_id)
                    setUsersList(users)
                    setRoleMap(await getRoles())

                    console.log(orgUserExists.role, roleMap[orgUserExists.role])
                })(

                )

            } else {
                authModelOnOpen();
                console.log("User is logged out");
            }
        });
    }, []);



    return <>
        <UserList users={usersList} currentRole={orgUser ? orgUser.role: -1} currentUser={user} />
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

        <InsufficientModal isOpen={orgUser && ![0,1].includes(orgUser.role)} />
    </>
}

export default  Dashboard