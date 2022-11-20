const { Client } = require('pg');
const {DATABASE_URL = 'postgres://localhost:5432/juicebox-dev'} = process.env;
const client = new Client({
    connectionString: DATABASE_URL,
    ssl: process.env.NODe_ENV === 'production' ? {rejectUnauthorized: false} : undefined,
});

const getAllUsers = async () => {
    const { rows } = await client.query(
        `SELECT id, username, name, location, active FROM users;`
    )
    return rows
}
const getAllPosts = async () => {
    try{
        const { rows: postIds } = await client.query(`
        SELECT id FROM posts
    `)
    const post = await Promise.all(postIds.map(post => getPostById( post.id)))
        return post;
    } catch(error){
        throw error
    }
}
const getAllTags = async () => {
    try{
    const { rows } = await client.query(`
    SELECT *
    FROM tags;
    `)
    return rows;
    }catch(error){
        throw error;
    }
}
const getUserByUsername = async (username) => {
    try{
        const { rows: [user] } = await client.query(`
            SELECT *
            FROM users
            WHERE username=$1;
        `, [username])
        return user
    }catch(error){
        throw(error)
    }
}
const createUser = async ({ username, password, name, location}) => {
    try {
        const { rows } = await client.query(`
        INSERT INTO users(username, password, name, location)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (username) DO NOTHING
        RETURNING *;
        `, [username, password, name, location]);
        return rows;
    } catch(error){
        console.log("error is in create user")
        console.error(error)
    }
}
const createPost = async ({authorId, title, content, tags = []}) => {
    try{
        const { rows: [post] } = await client.query(`
            INSERT INTO posts("authorId", title, content)
            VALUES ($1, $2, $3)
            RETURNING *;
        `, [authorId, title, content])
        const tagList = await createTags(tags);
        return await addTagsToPost(post.id, tagList);
    } catch(error){
        console.log("error is in create post")
        throw error
    }
}
const updateUser = async (id, fields = {}) => {
    const setString = Object.keys(fields).map((key, index) =>
        `"${ key }"=$${ index + 1 }`
    ).join(', ');
    if(setString.length === 0){
        return;
    }
    try{
        const {rows: [user]} = await client.query(`
            UPDATE users
            SET ${setString}
            WHERE id=${id}
            RETURNING *;
        `, Object.values(fields));
        return user;
    } catch(error){
        throw error;
    }
}

const updatePost = async (postId, fields = {}) => {

    const {tags} = fields;
    delete fields.tags;

    const setString = Object.keys(fields).map((key, index) =>
        `"${ key }"=$${ index + 1 }`
    ).join(', ');

    try{
        if(setString.length > 0){
            await client.query(`
            UPDATE posts
            SET ${setString}
            WHERE id=${postId}
            RETURNING *;
        `, Object.values(fields));
        }

        if(tags === undefined){
            return await getPostById(postId)
        }
        const tagList = await createTags(tags);
        const tagListIdString = tagList.map(tag => `${tag.id}`).join(', ')

        await client.query(`
        DELETE FROM post_tags
        WHERE "tagId" NOT IN (${tagListIdString})
        AND "postId"=$1;
        `, [postId]);
        await addTagsToPost(postId, tagList);

        return await getPostById(postId);
    } catch(error){
        throw error;
    }
}
const getPostsByUser = async (userId) => {
    try{
        const { rows: postIds } = await client.query(`
        SELECT id FROM posts
        WHERE "authorId"=${ userId };
        `)
        const post = await Promise.all(postIds.map(post => getPostById( post.id)))
        return post;
    } catch(error){
        throw error
    }
}
const getUserById = async (userId) => {
     try{ const { rows } = await client.query(`
    SELECT * FROM users
    WHERE id=${userId};
    `)
    if(rows[0]){
        delete rows[0].password
        const user = rows[0]
        const posts = await getPostsByUser(userId);
        user.posts = posts
        return user;
    } else {
        return null
    }
} catch(error){
    throw error
}
    
}

async function createTags(tagList) {
    if (tagList.length === 0) { 
      return; 
    }
    const insertValues = tagList.map(
      (_, index) => `$${index + 1}`).join('), (');
    const selectValues = tagList.map(
      (_, index) => `$${index + 1}`).join(', ');
    try {
        const result = await client.query(`
        INSERT INTO tags(name)
        VALUES (${insertValues})
        ON CONFLICT (name) DO NOTHING;
        `, tagList)
        const {rows } = await client.query(`
        SELECT * FROM tags
        WHERE name
        IN (${selectValues})
        `, tagList)
      return rows
    } catch (error) {
      throw error;
    }
  }
const createPostTag = async (postId, tagId) => {
    try {
    await client.query(`
      INSERT INTO post_tags("postId", "tagId")
      VALUES ($1, $2)
      ON CONFLICT ("postId", "tagId") DO NOTHING;
    `, [postId, tagId]);
    } catch(error){
        throw error
    }
}
async function addTagsToPost(postId, tagList) {
    try {
      const createPostTagPromises = tagList.map(
        tag => createPostTag(postId, tag.id)
      );
  
      await Promise.all(createPostTagPromises);
  
      return await getPostById(postId);
    } catch (error) {
      throw error;
    }
  }
  async function getPostById(postId) {
    try {
      const { rows: [ post ]  } = await client.query(`
        SELECT *
        FROM posts
        WHERE id=$1;
      `, [postId]);
        if(!post){
            throw{
                name: "postnotfound",
                message: "Could not find a post with that ID"
            };
        }

      const { rows: tags } = await client.query(`
        SELECT tags.*
        FROM tags
        JOIN post_tags ON tags.id=post_tags."tagId"
        WHERE post_tags."postId"=$1;
      `, [postId])
  
      const { rows: [author] } = await client.query(`
        SELECT id, username, name, location
        FROM users
        WHERE id=$1;
      `, [post.authorId])
  
      post.tags = tags;
      post.author = author;
  
      delete post.authorId;
    
      return post;
    } catch (error) {
      throw error;
    }
  }

  async function getPostsByTagName(tagName) {
    try {
      const { rows: postIds } = await client.query(`
        SELECT posts.id
        FROM posts
        JOIN post_tags ON posts.id=post_tags."postId"
        JOIN tags ON tags.id=post_tags."tagId"
        WHERE tags.name=$1;
      `, [tagName]);
  
      return await Promise.all(postIds.map(
        post => getPostById(post.id)
      ));
    } catch (error) {
      throw error;
    }
  } 
module.exports = {
    client,
    getAllUsers,
    createUser,
    updateUser,
    createPost,
    updatePost,
    getAllPosts,
    getPostsByUser,
    getUserById,
    createTags,
    createPostTag,
    addTagsToPost,
    getPostById,
    getPostsByTagName,
    getUserByUsername,
    getAllTags
}