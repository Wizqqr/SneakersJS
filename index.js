import bodyParser from "body-parser";
import pgPromise from "pg-promise";
import express from "express";
import session from 'express-session';
import dotenv from 'dotenv';
import methodOverride from "method-override"
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
    const { userName = "", img = "", content = "", stars = "" } = req.body;
    const user = req.session.user;

    if (!userName.trim() || !img.trim() || !content.trim() || !stars.trim() || !user) {
        const sneakers = await db.any('SELECT * FROM sneakers');
        res.render("new-comment.ejs", { error: 'All fields are required to create a comment' }, {sneakers});
    } else {
        try {
            await db.none('INSERT INTO comments(user_name, img, content, stars, user_email) VALUES($1, $2, $3, $4, $5)', [userName, img, content, stars, user.email]);
            res.redirect('/');
        } catch (error) {
            console.error('Error creating comment:', error);
            res.sendStatus(500);
        }
    }
});
app.delete('/comments/:id', async (req, res) => {
    const commentId = req.params.id;
    const user = req.session.user;

    if (!user) {
        return res.status(401).send('Unauthorized');
    }

    try {
        const comment = await db.oneOrNone('SELECT * FROM comments WHERE id = $1', [commentId]);

        if (!comment) {
            return res.status(404).send('Комментарий не найден');
        }

        if (comment.user_email !== user.email) {
            return res.status(403).send('Доступ запрещен: Вы можете удалить только свои комментарии');
        }

        await db.none('DELETE FROM comments WHERE id = $1', [commentId]);
        res.redirect('/');
    } catch (error) {
        console.error('Ошибка при удалении комментария:', error);
        res.status(500).send('Внутренняя ошибка сервера');
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
            req.session.user = { username: name, email: email }; // Set session
            res.redirect('/');
        }
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
});

app.post("/login", async (req, res) => {
    const email = req.body.email; // Correct the field name
    const password = req.body.password;

    try {
        const result = await dbUsers.any(`SELECT * FROM users WHERE email = $1`, [email]);
        if (result.length > 0) {
            const user = result[0];
            const storedPassword = user.password;

            if (storedPassword === password) {
                req.session.user = { username: user.username, email: user.email }; // Set session
                res.redirect('/');
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
