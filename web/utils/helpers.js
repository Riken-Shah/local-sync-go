import {db, auth} from "./firebase";
import { collection, doc, setDoc,getDoc, query, updateDoc, getDocs, where } from "firebase/firestore";

const rolesMap = {}
export async function getRoles() {
    const roleRef = query(collection(db, "roles"))
    const rolesSnap = await getDocs(roleRef)
    rolesSnap.forEach((doc) => {
        rolesMap[doc.id] = doc.get("type")
    })
    console.log(rolesMap)
    return rolesMap
}



export async function getOrg(orgID) {
    if(!orgID) {return  false}
    console.log("orgpath", orgID)
    const orgRef = doc(db, "orgs", orgID)
    const orgSnap = await getDoc(orgRef)

    if (orgSnap.exists()) {
        return await getOrgUser(orgID)
    }
    return false
}

export async function getOrgUser(){
    const docID = auth.currentUser.uid
    const orgUserRef = doc(db, "org_users", docID);
    const orgUserSnap = await getDoc(orgUserRef)

    if (orgUserSnap.exists()) {
        const orgUserData = orgUserSnap.data()
        const role = orgUserData["role"]
        const orgID = orgUserData["org_id"]
        let orgRoleData = {}
        if (role !== 0) {
            console.log("role", role, "org_id", orgID)
            const orgRoleRef = doc(db, "orgs", orgID, "roles", role.toString())
            const orgRoleSnap = await getDoc(orgRoleRef)
            orgRoleData = orgRoleSnap.data()
        }

        return {...orgUserData, roleData: orgRoleData}
    }
    return false
}

export async function createOrgUser(orgID) {
    const snap = {
        org_id: orgID.trim(),
        user_id: auth.currentUser.uid,
        role: 4,
    }
    console.log("trying to create snap", snap)
    await setDoc(doc(db, "org_users", auth.currentUser.uid), snap)
    return await getOrgUser()
}

export async function getAllOrgUsers(orgID) {
    const orgUsersQuery = query(collection(db, "org_users"), where("org_id", "==", orgID));
    const orgUsersSnapshot = await getDocs(orgUsersQuery);

    const orgUsers = [];
    console.log("orgs: ", orgUsersSnapshot.docs)
    for (const doc of orgUsersSnapshot.docs) {
        const orgUserData = doc.data();
        const userId = orgUserData.user_id;

        // Fetch user details based on user_id
        const userQuery = query(collection(db, "users"), where("uid", "==", userId));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.docs.length > 0) {
            const userData = userSnapshot.docs[0].data();

            // Combine org user data with user details
            const combinedData = {
                ...orgUserData,
                ...userData
            };

            orgUsers.push(combinedData);
        }
    }

    console.log(orgUsers)

    return orgUsers;
}

export async function updateUserRole(uid, updatedRole) {
    const userDoc = doc(db, "org_users", uid)
    await updateDoc(userDoc, {
        role: parseInt(updatedRole)
    })
    console.log("updated user", userDoc)
}
