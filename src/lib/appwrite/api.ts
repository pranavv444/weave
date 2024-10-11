import { ID, Query, ImageGravity } from "appwrite";
import { INewPost, INewUser, IUpdatePost } from "@/types";
import { account, appwriteConfig, avatars, databases, storage } from "./config";

export async function createUserAccount(user: INewUser) {
  try {
    const newAccount = await account.create(
      ID.unique(),
      user.email,
      user.password,
      user.name
    );
    if (!newAccount) throw Error;
    // const avatarUrl = new URL(avatars.getInitials(user.name)); // Convert to URL
    const avatarUrl = avatars.getInitials(user.name);
    const newUser = await saveUserToDB({
      accountId: newAccount.$id,
      name: newAccount.name,
      email: newAccount.email,
      username: user.username,
      imageUrl: new URL(avatarUrl), // Convert string to URL
    });

    return newUser;
  } catch (error) {
    console.log(error);
    return error;
  }
}

export async function saveUserToDB(user: {
  accountId: string;
  name: string;
  email: string;
  imageUrl: URL;
  username?: string;
}) {
  try {
    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      user
    );
    return newUser; // Added return statement
  } catch (error) {
    console.log(error);
  }
}

export async function signInAccount(user: { email: string; password: string }) {
  try {
    const session = await account.createEmailPasswordSession(
      user.email,
      user.password
    );
    return session;
  } catch (error) {
    console.log(error);
  }
}

export async function getCurrentUser() {
  try {
    // Check if the user is authenticated
    const currentAccount = await account.get();
    if (!currentAccount) throw new Error("No current account found.");

    // If authenticated, fetch user details from the database
    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (!currentUser || currentUser.total === 0)
      throw new Error("No user found in the database.");

    return currentUser.documents[0];
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function signOutAccount() {
  try {
    const session = await account.deleteSession("current");
    return session;
  } catch (error) {
    console.log(error);
  }
}

export async function createPost(post: INewPost) {
  try {
    //upload image to storage
    const uploadedFile = await uploadFile(post.file[0]);
    if (!uploadedFile) throw Error;

    //get file url
    const fileUrl = getFilePreview(uploadedFile.$id);
    if (!fileUrl) {
      deleteFile(uploadedFile.$id);
      throw Error;
    }
    //convert tags into array

    const tags = post.tags?.replace(/ /g, "").split(",") || [];

    //save new post to database
    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      ID.unique(),
      {
        caption: post.caption,
        imageUrl: fileUrl,
        imageId: uploadedFile.$id,
        location: post.location,
        tags: tags,
        creator: post.userId,
      }
    );
    if (!newPost) {
      await deleteFile(uploadedFile.$id);
      throw Error;
    }
    return newPost;
  } catch (error) {
    console.log(error);
  }
}

export async function uploadFile(file: File) {
  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      file
    );
    return uploadedFile;
  } catch (error) {
    console.log(error);
  }
}

export function getFilePreview(fileId: string) {
  try {
    const fileUrl = storage.getFilePreview(
      appwriteConfig.storageId,
      fileId,
      2000,
      2000,
      ImageGravity.Top,
      100,
    );
    console.log({ fileUrl });

    if (!fileUrl) throw Error;

    return fileUrl;
  } catch (error) {
    console.log(error);
  }
}

export async function deleteFile(fileId: string) {
  try {
    await storage.deleteFile(appwriteConfig.storageId, fileId);
    return { status: "success" };
  } catch (error) {
    console.log(error);
  }
}

export async function getRecentPosts() {
  const posts = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.postCollectionId,
    [Query.orderDesc("$createdAt"), Query.limit(20)]
  );
  if (!posts) throw Error;

  return posts;
}

export async function likePost(postId:string,likesArray:string[]){
  try{
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId,
      {
        likes:likesArray
      }
    )
    if(!updatedPost) throw Error;
    return updatedPost;

  }
  catch(error){
    console.log(error);
  }

}

export async function savePost(postId:string,userId:string){
  try{
    const updatedPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      ID.unique(),
      {
        user:userId,
        post:postId,
      }
    )
    if(!updatedPost) throw Error;
    return updatedPost;

  }
  catch(error){
    console.log(error);
  }

}

export async function deleteSavedPost(savedRecordId:string){
  try{
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      savedRecordId,
    )
    if(!statusCode) throw Error;
    return {status:'ok'};

  }
  catch(error){
    console.log(error);
  }

}

export async function getPostById(postId:string){
  try{
    const post = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId
    )
    if(!post) throw Error;
    return post;
  }
  catch(error){
    console.log(error);
  }
}

export async function updatePost(post: IUpdatePost) {
  const hasFileToUpdate = post.file.length > 0;

  try {
    // Initialize the image object with default values
    let image = {
      imageUrl: new URL(post.imageUrl), // Convert to URL object
      imageId: post.imageId ,
    };

    if (hasFileToUpdate) {
      const uploadedFile = await uploadFile(post.file[0]);
      if (!uploadedFile) throw new Error("File upload failed");

      // Get file URL
      const fileUrl = getFilePreview(uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw new Error("File preview generation failed");
      }

      // Convert fileUrl to URL object
      const fileUrlObject = new URL(fileUrl);

      // Update the image object with new values
      image = { ...image, imageUrl: fileUrlObject, imageId: uploadedFile.$id };
    }

    // Convert tags into array
    const tags = post.tags?.replace(/ /g, "").split(",") || [];

    // Save new post to database
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      post.postId,
      {
        caption: post.caption,
        imageUrl: image.imageUrl,
        imageId: image.imageId,
        location: post.location,
        tags: tags,
      }
    );

    if (!updatedPost) {
      await deleteFile(image.imageId);
      throw new Error("Post update failed");
    }

    return updatedPost;
  } catch (error) {
    console.log(error);
    throw error; // Re-throw the error to handle it upstream if needed
  }
} 

export async function deletePost(postId: string,imageId:string) {
  if(!postId || !imageId) throw Error;

  try{
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId
    )
    return {status:'ok'}

  }
  catch(error){
    console.log(error);
  }
}
