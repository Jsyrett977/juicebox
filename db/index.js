const { Client } = require('pg');
const client = new Client("postgres://localhost:5432/juicebox-dev");

const getAllUsers = async () => {
    const { rows } = await client.query(
        `SELECT id, username, name, location, active FROM users;`
    )
    return rows
}
const getAllPosts = async () => {
    try{
        const { rows } = await client.query(`
        SELECT id, "authorId", title, content, active FROM posts
    `)
    return rows;
    } catch(error){
        throw error
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
        console.error(error)
    }
}
const createPost = async ({authorId, title, content}) => {
    try{
        const { rows } = await client.query(`
            INSERT INTO posts("authorId", title, content)
            VALUES ($1, $2, $3)
        `, [authorId, title, content])
        return rows;
    } catch(error){
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

const updatePost = async (id, fields = {}) => {
    const setString = Object.keys(fields).map((key, index) =>
        `"${ key }"=$${ index + 1 }`
    ).join(', ');
    if(setString.length === 0){
        return;
    }
    try{
        const {rows: [post]} = await client.query(`
            UPDATE posts
            SET ${setString}
            WHERE id=${id}
            RETURNING *;
        `, Object.values(fields));
        return post;
    } catch(error){
        throw error;
    }
}
const getPostsByUser = async (userId) => {
    try{
        const { rows } = await client.query(`
        SELECT * FROM posts
        WHERE "authorId"=${ userId };
        `)
        return rows;
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

module.exports = {
    client,
    getAllUsers,
    createUser,
    updateUser,
    createPost,
    updatePost,
    getAllPosts,
    getPostsByUser,
    getUserById
}