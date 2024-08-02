import bodyParser from "body-parser";
import methodOverride from "method-override";
import pgPromise from "pg-promise";
import express from "express";
import session from 'express-session';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const pgp = pgPromise();
const db = pgp({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME_WORLD,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const dbUsers = pgp({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME_SECRETS,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}));

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

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
);`).catch(error => {
    console.error("Error creating sneakers table:", error);
});

app.get('/', async (req, res) => {
    try {
        const sneakers = await db.any(`SELECT * FROM sneakers WHERE bestSeller = FALSE ORDER BY id ASC`);
        const bestSellers = await db.any(`SELECT * FROM sneakers WHERE bestSeller = TRUE ORDER BY id ASC`);
        const reviews = await db.any(`SELECT * FROM comments ORDER BY id DESC`);
        const user = req.session ? req.session.user : null;

        console.log(sneakers);
        res.render('main.ejs', { sneakers, bestSellers, reviews, user });
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

app.get('/login', (req, res) => {
    res.render('login.ejs');
});

app.get('/register', (req, res) => {
    res.render('register.ejs');
});

app.post('/comments', async (req, res) => {
    const { userName, img, content, stars } = req.body;
    if (!userName.trim() || !content.trim() || !stars.trim()) {
        res.render("new-comment.ejs", { error: 'All fields are required to create a comment' });
    } else {
        try {
            await db.none('INSERT INTO comments(user_name, img, content, stars) VALUES($1, $2, $3, $4)', [userName, img, content, stars]);
            res.redirect('/');
        } catch (error) {
            console.error('Error creating comment:', error);
            res.sendStatus(500);
        }
    }
});

app.post("/register", async (req, res) => {
    const name = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    try {
        const checkResult = await dbUsers.any(`SELECT * FROM users WHERE email = $1`, [email]);
        if (checkResult.length > 0) {
            res.send("Email already exists. Retry");
        } else {
            await dbUsers.none(`INSERT INTO users (email, password, username) VALUES ($1, $2, $3)`, [email, password, name]);

            const sneakers = await db.any(`SELECT * FROM sneakers WHERE bestSeller = FALSE ORDER BY id ASC`);
            const bestSellers = await db.any(`SELECT * FROM sneakers WHERE bestSeller = TRUE ORDER BY id ASC`);
            const reviews = await db.any(`SELECT * FROM comments ORDER BY id DESC`);

            req.session.user = { username: name, email: email };
            res.render("main.ejs", { sneakers, reviews, bestSellers, user: req.session.user });
        }
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
});

app.post("/login", async (req, res) => {
    const email = req.body.username;
    const password = req.body.password;

    try {
        const result = await dbUsers.any(`SELECT * FROM users WHERE email = $1`, [email]);
        const sneakers = await db.any(`SELECT * FROM sneakers WHERE bestSeller = FALSE ORDER BY id ASC`);
        const bestSellers = await db.any(`SELECT * FROM sneakers WHERE bestSeller = TRUE ORDER BY id ASC`);
        const reviews = await db.any(`SELECT * FROM comments ORDER BY id DESC`);
        if (result.length > 0) {
            const user = result[0];
            const storedPassword = user.password;

            if (storedPassword === password) {
                res.render('main.ejs', { sneakers, reviews, bestSellers, user });
            } else {
                res.send('Incorrect password');
            }
        } else {
            res.send('User not found');
        }
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
});

app.listen(port, () => {
    console.log(`The server started on port ${port}`);
});
