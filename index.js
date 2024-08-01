import bodyParser from "body-parser";
import methodOverride from "method-override";
import pgPromise from "pg-promise";
import express from "express";

const app = express();
const port = 3000;

const pgp = pgPromise();
const db = pgp({
    user: "postgres",
    host: "localhost",
    database: "world",
    password: "Aziret7bklassAfisha",
    port: 5432,
})

app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: true}))
app.use(methodOverride('_method'))

db.none(`CREATE TABLE IF NOT EXISTS sneakers(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    size VARCHAR(50) NOT NULL,
    color VARCHAR(50) NOT NULL,
    stock INT NOT NULL,
    description TEXT,
    release_date DATE,
    category VARCHAR(100),
    image_url VARCHAR(255)
    );`).catch(error=>{
        console.error("Error creating posts table:", error);
    })

app.get('/', async (req, res) => {
    try {
        const sneakers = await db.any(`SELECT * FROM sneakers WHERE bestSeller = FALSE ORDER BY id ASC`);
        const bestSellers = await db.any(`SELECT * FROM sneakers WHERE bestSeller = TRUE ORDER BY id ASC`);
        const reviews = await db.any(`SELECT * FROM comments ORDER BY id DESC`); // Fetch reviews
        res.render('main.ejs', { sneakers, bestSellers, reviews });
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/comments/new', async (req, res) => {
    try {
        const sneakers = await db.any('SELECT * FROM sneakers');
        res.render('new-comment.ejs', { sneakers });
    } catch (error) {
        console.error("Error fetching sneakers:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.post('/comments', async (req, res) => {
    const { user, img, content, stars } = req.body;
    if (!user.trim() || !content.trim() || !stars.trim()) {
        res.render("new-comment.ejs", { error: 'All fields are required to create a comment' });
    } else {
        try {
            await db.none('INSERT INTO comments(user_name, img, content, stars) VALUES($1, $2, $3, $4)', [user, img, content, stars]);
            res.redirect('/');
        } catch (error) {
            console.error('Error creating comment:', error);
            res.sendStatus(500);
        }
    }
});

app.listen(port, ()=>{
    console.log(`The server started on port ${port}`)
})