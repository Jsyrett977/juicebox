const { client,
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
    getPostsByTagName } = require('./index')

async function dropTables() {
    try {
      console.log("Starting to drop tables...");
  
      await client.query(`
        DROP TABLE If EXISTS post_tags;
        DROP TABLE IF EXISTS tags;
        DROP TABLE IF EXISTS posts;
        DROP TABLE IF EXISTS users;
      `);
  
      console.log("Finished dropping tables!");
    } catch (error) {
      console.error("Error dropping tables!");
      throw error;
    }
  }
  
  async function createTables() {
    try {
      console.log("Starting to build tables...");
  
      await client.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username varchar(255) UNIQUE NOT NULL,
          password varchar(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          location VARCHAR(255) NOT NULL,
          active BOOLEAN DEFAULT true
        );
      `);
      await client.query(`
      CREATE TABLE posts(
        id SERIAL PRIMARY KEY,
        "authorId" INTEGER REFERENCES users(id) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        active BOOLEAN DEFAULT true
      );
      `);
    await client.query(`
    CREATE TABLE tags(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE
    );
    `)
    await client.query(`
    CREATE TABLE post_tags(
        "postId" INTEGER REFERENCES posts(id),
        "tagId" INTEGER REFERENCES tags(id),
        UNIQUE("postId", "tagId")
    );
    `)
  

      console.log("Finished building tables!");
    } catch (error) {
      console.error("Error building tables!");
      throw error;
    }
  }
  const createInitialsUsers = async () => {
    try {
        console.log("Starting to create users...")
        const albert = await createUser({ username: 'albert', password: 'bertie99', name: 'Albert', location: 'Sidney' });
        const sanda = await createUser({username: 'sandra', password: '2sandy4me', name: 'Sandy', location: 'The Beach'})
        const glamgal = await createUser({username: 'glamgal', password: 'soglam', name: 'Josh', location: 'Florida'})
        console.log("Finished creating users!");
    } catch(error){

    }
  }
const createInitialPosts = async () => {
        try{
        const [albert, sandra, glamgal] = await getAllUsers();

        await createPost({authorId: albert.id, title: 'First Post', content: 'the content', tags: ["#happy", "#youcandoanything"]})
        await createPost({authorId: glamgal.id, title: 'Second Post', content: 'the content x 2', tags: ["#happy", "#youcandoanything", "#canmandoeverything"]})
        await createPost({authorId: sandra.id, title: 'Third Post', content: 'the content x 3', tags: ["#happy", "#worst-day-ever"]})
    } catch(error) {
        console.log("error is in create init post")
        throw error;
    }
}
  async function rebuildDB() {
    try {
      client.connect();
  
      await dropTables();
      await createTables();
      await createInitialsUsers();
      await createInitialPosts();
    } catch (error) {
      throw error;
    }
  }
  
  async function testDB() {
    try {
      //console.log("Starting to test database...");
  
      //console.log("Calling getAllUsers");
      const users = await getAllUsers();
      //console.log("Result:", users);
  
      //console.log("Calling updateUser on users[0]");
      const updateUserResult = await updateUser(users[0].id, {
        name: "Newname Sogood",
        location: "Lesterville, KY"
      });
      //console.log("Result:", updateUserResult);
  
      //console.log("Calling getAllPosts");
      const posts = await getAllPosts();
      //console.log("Result:", posts);
  
      //console.log("Calling updatePost on posts[0]");
      const updatePostResult = await updatePost(posts[0].id, {
        title: "New Title",
        content: "Updated Content"
      });
      //console.log("Result:", updatePostResult);
  
      //console.log("Calling getUserById with 1");
      const albert = await getUserById(1);
      //console.log("Result:", albert);
      console.log("Calling updatePost on posts[1], only updating tags");
    const updatePostTagsResult = await updatePost(posts[1].id, {
      tags: ["#youcandoanything", "#redfish", "#bluefish"]
    });
    console.log("Result:", updatePostTagsResult);

      console.log("Calling getPostsByTagName with #happy");
    const postsWithHappy = await getPostsByTagName("#happy");
    console.log("Result:", postsWithHappy);
      //console.log("Finished database tests!");
    } catch (error) {
      console.log("Error during testDB");
      throw error;
    }
  }

  rebuildDB()
    .then(testDB)
    .catch(console.error)
    .finally(() => client.end());   

    